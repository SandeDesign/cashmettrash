import React, { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Send, CheckCircle, AlertCircle, Loader2, Inbox as InboxIcon, Clock, Settings as SettingsIcon, Trash2, RefreshCw, X, Eye, EyeOff, Circle, ExternalLink, SortAsc, SortDesc, Archive, ArchiveRestore, Folder, FolderOpen, FolderPlus, FolderX, MoveRight, Paperclip, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { EmailAttachment } from '../../types';
import { collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { SentEmail, EmailSettings, ReceivedEmail, ArchiveFolder } from '../../types';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';

type TabType = 'inbox' | 'sent' | 'settings' | 'archive';

interface InboxAPIResponse {
  success: boolean;
  emails: Array<{
    id: string;
    uid: string; // IMAP UID from server
    from: string;
    to: string;
    subject: string;
    date: string;
    preview: string;
    body: string;
    isHtml: boolean;
    isRead: boolean;
    attachments?: EmailAttachment[];
  }>;
  total: number;
  fetched_at: string;
  error?: string;
}

const EmailTool: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  // Compose state
  const [composeMode, setComposeMode] = useState<'plain' | 'html'>('html');
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Inbox state
  const [inboxEmails, setInboxEmails] = useState<ReceivedEmail[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  // Inbox filter state
  const [filterSort, setFilterSort] = useState<'newest' | 'oldest'>('newest');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  // Archive state
  const [archiveFolders, setArchiveFolders] = useState<ArchiveFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<ArchiveFolder | null>(null);
  const [archiveModalEmail, setArchiveModalEmail] = useState<string | null>(null); // email id to archive
  const [moveModalEmail, setMoveModalEmail] = useState<ReceivedEmail | null>(null); // email to move
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState<'root' | 'sub' | null>(null);

  // Reply state
  const [replyEmail, setReplyEmail] = useState<ReceivedEmail | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [includeQuote, setIncludeQuote] = useState(true);

  // Link preview state
  const [linkPreviewUrl, setLinkPreviewUrl] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState(400);

  // Attachment preview state
  const [previewAttachment, setPreviewAttachment] = useState<EmailAttachment | null>(null);

  // Sent emails state
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [selectedSentEmail, setSelectedSentEmail] = useState<SentEmail | null>(null);

  // Settings state
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    id: user?.uid || '',
    signature: '',
    signature_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Open compose modal with pre-filled data from query params (e.g. from Customers page)
  useEffect(() => {
    const toEmail = searchParams.get('to');
    const toName = searchParams.get('name');
    if (toEmail) {
      setFormData(prev => ({
        ...prev,
        to: toEmail,
        subject: toName ? `Vlottr - Bericht aan ${toName}` : 'Vlottr - Contact'
      }));
      setComposeModalOpen(true);
    }
  }, []);

  // Load settings and archive folders on mount
  useEffect(() => {
    if (user?.uid) {
      loadEmailSettings();
      loadArchiveFolders();
    }
  }, [user?.uid]);

  // Load sent emails when sent tab is active
  useEffect(() => {
    if (activeTab === 'sent') {
      loadSentEmails();
    }
  }, [activeTab]);

  // Load inbox from Firestore when inbox tab is active
  useEffect(() => {
    if (activeTab === 'inbox') {
      loadInboxFromFirestore();
    }
  }, [activeTab]);

  // Listen for messages from email body iframe (link clicks + auto-resize)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'link' && event.data.url) {
        try {
          new URL(event.data.url);
          setLinkPreviewUrl(event.data.url);
        } catch {
          // Ongeldige URL (relatief, tel:, etc.) — negeer
        }
      }
      if (event.data.type === 'resize' && typeof event.data.height === 'number') {
        setIframeHeight(Math.min(event.data.height + 32, 900));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ============================================
  // INBOX FUNCTIONS
  // ============================================

  // Load all saved emails from Firestore (shown on tab open)
  const loadInboxFromFirestore = async () => {
    setLoadingInbox(true);
    setInboxError(null);

    try {
      const q = query(
        collection(db, 'received_emails'),
        orderBy('date', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const emails = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ReceivedEmail));
      setInboxEmails(emails);
    } catch (error) {
      console.error('Firestore inbox load error:', error);
      setInboxError('Kon emails niet laden uit database');
    } finally {
      setLoadingInbox(false);
    }
  };

  // Fetch NEW emails from IMAP, save to Firestore, append to list
  const fetchInboxEmails = async () => {
    if (!user?.uid) return;

    setLoadingInbox(true);
    setInboxError(null);

    try {
      const response = await fetch('https://internedata.nl/uploads/vlottr/mail/inbox.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: InboxAPIResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Kon emails niet ophalen');
      }

      setLastFetchedAt(data.fetched_at);

      if (data.emails.length === 0) {
        setStatus({ type: 'success', message: 'Geen nieuwe emails' });
        setTimeout(() => setStatus({ type: null, message: '' }), 3000);
        return;
      }

      // Save new emails to Firestore
      await saveEmailsToFirebase(data.emails);

      // Append new emails to existing list (avoid duplicates by uid)
      setInboxEmails(prev => {
        const existingUids = new Set(prev.map(e => e.uid));
        const newEmails = (data.emails as ReceivedEmail[]).filter(e => !existingUids.has(e.uid));
        return [...newEmails, ...prev];
      });

      setStatus({ type: 'success', message: `${data.emails.length} nieuwe email${data.emails.length !== 1 ? 's' : ''} opgehaald` });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Inbox fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Netwerkfout: Kon geen verbinding maken';
      setInboxError(errorMessage);
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setLoadingInbox(false);
    }
  };

  const saveEmailsToFirebase = async (emails: ReceivedEmail[]) => {
    if (!user?.uid) return;

    try {
      const savePromises = emails.map(async (email) => {
        const emailDoc = {
          ...email,
          fetched_at: new Date().toISOString(),
          fetched_by: user.uid,
        };

        // Use merge to not overwrite existing data
        await setDoc(doc(db, 'received_emails', email.id), emailDoc, { merge: true });
      });

      await Promise.all(savePromises);
      console.log(`Saved ${emails.length} emails to Firebase`);
    } catch (error) {
      console.error('Firebase save error:', error);
      // Don't throw - saving to Firebase is optional
    }
  };

  const toggleEmailRead = async (emailId: string, currentReadStatus: boolean) => {
    const newReadStatus = !currentReadStatus;

    // Optimistic UI update
    setInboxEmails(prev =>
      prev.map(email =>
        email.id === emailId ? { ...email, isRead: newReadStatus } : email
      )
    );

    try {
      // 1. Update via backend (IMAP)
      const response = await fetch('https://internedata.nl/uploads/vlottr/mail/mark_as_read.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: emailId,
          isRead: newReadStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Kon email status niet updaten');
      }

      // 2. Update Firebase after successful backend update
      await setDoc(
        doc(db, 'received_emails', emailId),
        {
          isRead: newReadStatus,
          updated_at: new Date().toISOString()
        },
        { merge: true }
      );

      console.log(`Email ${emailId} marked as ${newReadStatus ? 'read' : 'unread'}`);

    } catch (error) {
      console.error('Error updating read status:', error);

      // Revert optimistic update on error
      setInboxEmails(prev =>
        prev.map(email =>
          email.id === emailId ? { ...email, isRead: currentReadStatus } : email
        )
      );

      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Kon status niet updaten';
      setStatus({ type: 'error', message: errorMessage });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleEmailClick = (email: ReceivedEmail) => {
    setSelectedEmail(email);
    setIframeHeight(400);
    // Do NOT auto-mark as read on open - user clicks the eye button manually
  };

  const closeEmailDetail = () => {
    setSelectedEmail(null);
  };

  const deleteInboxEmail = async (emailId: string) => {
    if (!confirm('Weet je zeker dat je deze email wilt verwijderen?')) return;

    try {
      await deleteDoc(doc(db, 'received_emails', emailId));
      setInboxEmails(prev => prev.filter(e => e.id !== emailId));
      setStatus({ type: 'success', message: 'Email verwijderd' });
      setTimeout(() => setStatus({ type: null, message: '' }), 2000);

      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      setStatus({ type: 'error', message: 'Kon email niet verwijderen' });
    }
  };

  // ============================================
  // ARCHIVE FOLDER FUNCTIONS
  // ============================================

  const loadArchiveFolders = async () => {
    setLoadingFolders(true);
    try {
      const q = query(collection(db, 'archive_folders'), orderBy('created_at', 'asc'));
      const snapshot = await getDocs(q);
      setArchiveFolders(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ArchiveFolder)));
    } catch (error) {
      console.error('Error loading archive folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const createArchiveFolder = async (name: string, parentId?: string): Promise<ArchiveFolder | null> => {
    if (!user?.uid || !name.trim()) return null;
    setCreatingFolder(true);
    try {
      const data: Omit<ArchiveFolder, 'id'> = {
        name: name.trim(),
        created_at: new Date().toISOString(),
        created_by: user.uid,
        ...(parentId ? { parentId } : {}),
      };
      const ref = await addDoc(collection(db, 'archive_folders'), data);
      const folder: ArchiveFolder = { ...data, id: ref.id };
      setArchiveFolders(prev => [...prev, folder]);
      setNewFolderName('');
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      setStatus({ type: 'error', message: 'Kon map niet aanmaken' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return null;
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteArchiveFolder = async (folderId: string) => {
    if (!confirm('Map verwijderen? Emails in deze map worden teruggezet naar inbox.')) return;
    try {
      const emailsInFolder = inboxEmails.filter(e => e.archived && e.archiveFolder === folderId);
      await Promise.all(
        emailsInFolder.map(e =>
          setDoc(doc(db, 'received_emails', e.id), { archived: false, archiveFolder: null, updated_at: new Date().toISOString() }, { merge: true })
        )
      );
      setInboxEmails(prev =>
        prev.map(e => e.archiveFolder === folderId ? { ...e, archived: false, archiveFolder: undefined } : e)
      );
      await deleteDoc(doc(db, 'archive_folders', folderId));
      setArchiveFolders(prev => prev.filter(f => f.id !== folderId));
      if (selectedFolder?.id === folderId) setSelectedFolder(null);
      setStatus({ type: 'success', message: 'Map verwijderd' });
      setTimeout(() => setStatus({ type: null, message: '' }), 2000);
    } catch (error) {
      console.error('Error deleting folder:', error);
      setStatus({ type: 'error', message: 'Kon map niet verwijderen' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const archiveEmailToFolder = async (emailId: string, folderId: string) => {
    setInboxEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, archived: true, archiveFolder: folderId } : e)
    );
    if (selectedEmail?.id === emailId) setSelectedEmail(null);
    setArchiveModalEmail(null);
    try {
      await setDoc(
        doc(db, 'received_emails', emailId),
        { archived: true, archiveFolder: folderId, updated_at: new Date().toISOString() },
        { merge: true }
      );
      setStatus({ type: 'success', message: 'Email gearchiveerd' });
      setTimeout(() => setStatus({ type: null, message: '' }), 2000);
    } catch (error) {
      console.error('Error archiving email:', error);
      setInboxEmails(prev =>
        prev.map(e => e.id === emailId ? { ...e, archived: false, archiveFolder: undefined } : e)
      );
      setStatus({ type: 'error', message: 'Kon email niet archiveren' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const moveEmailToFolder = async (emailId: string, folderId: string) => {
    setInboxEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, archiveFolder: folderId } : e)
    );
    setMoveModalEmail(null);
    try {
      await setDoc(
        doc(db, 'received_emails', emailId),
        { archiveFolder: folderId, updated_at: new Date().toISOString() },
        { merge: true }
      );
      setStatus({ type: 'success', message: 'Email verplaatst' });
      setTimeout(() => setStatus({ type: null, message: '' }), 2000);
    } catch (error) {
      console.error('Error moving email:', error);
      setStatus({ type: 'error', message: 'Kon email niet verplaatsen' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const unarchiveEmail = async (emailId: string) => {
    setInboxEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, archived: false, archiveFolder: undefined } : e)
    );
    try {
      await setDoc(
        doc(db, 'received_emails', emailId),
        { archived: false, archiveFolder: null, updated_at: new Date().toISOString() },
        { merge: true }
      );
      setStatus({ type: 'success', message: 'Email teruggezet naar inbox' });
      setTimeout(() => setStatus({ type: null, message: '' }), 2000);
    } catch (error) {
      console.error('Error unarchiving email:', error);
      setStatus({ type: 'error', message: 'Kon email niet terugzetten' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  // ============================================
  // REPLY FUNCTIONS
  // ============================================

  const extractEmailAddress = (fromField: string): string => {
    const match = fromField.match(/<([^>]+)>/);
    return match ? match[1] : fromField.trim();
  };

  const openReplyModal = (email: ReceivedEmail) => {
    const sig = emailSettings.signature_enabled && emailSettings.signature
      ? `<br><br><div style="border-top:1px solid #444;padding-top:12px;margin-top:12px;color:#aaa;font-size:13px;">${emailSettings.signature.replace(/\n/g, '<br>')}</div>`
      : '';
    setReplyMessage(sig);
    setReplyEmail(email);
    setIncludeQuote(true);
  };

  const sendReply = async () => {
    if (!replyEmail || !user) return;
    setSendingReply(true);
    const to = extractEmailAddress(replyEmail.from);
    const subject = replyEmail.subject.startsWith('Re:') ? replyEmail.subject : `Re: ${replyEmail.subject}`;
    const quoted = replyEmail.isHtml
      ? DOMPurify.sanitize(replyEmail.body)
      : replyEmail.body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');

    // Wrap in a proper HTML email document with light-mode styling for recipients
    const quotedSection = includeQuote
      ? `<div class="quoted">
  <p>Op ${new Date(replyEmail.date).toLocaleString('nl-NL')} schreef ${replyEmail.from}:</p>
  <div class="quoted-body">${quoted}</div>
</div>`
      : '';

    const fullMessage = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;background:#ffffff;margin:0;padding:16px;}
  p{margin:0 0 6px 0;}
  strong,b{font-weight:600;}em,i{font-style:italic;}u{text-decoration:underline;}
  ol,ul{margin:0 0 8px 0;padding-left:24px;}li{margin:2px 0;}
  a{color:#2563eb;}
  .ql-editor p{margin:0 0 6px 0;}
  .quoted{margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;}
  .quoted-body{margin-top:6px;padding-left:12px;border-left:3px solid #d1d5db;}
</style>
</head><body>
${replyMessage}
${quotedSection}
</body></html>`;

    try {
      const response = await fetch('https://internedata.nl/uploads/vlottr/mail/send.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, message: fullMessage, isHtml: true }),
      });
      const data = await response.json();

      const record: Record<string, any> = {
        from: 'noreply@vlottr.nl',
        to,
        subject,
        message: replyMessage,
        status: data.success ? 'sent' : 'failed',
        sent_by: user.uid,
        sent_by_name: user.name,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_reply: true,
        reply_to_id: replyEmail.id,
      };
      if (emailSettings.signature_enabled && emailSettings.signature) record.signature = emailSettings.signature;
      if (!data.success && data.error) record.error = data.error;
      await addDoc(collection(db, 'sent_emails'), record);

      if (data.success) {
        setStatus({ type: 'success', message: 'Antwoord verzonden!' });
        setReplyEmail(null);
        setReplyMessage('');
      } else {
        setStatus({ type: 'error', message: data.error || 'Kon antwoord niet verzenden' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Netwerkfout bij verzenden' });
    } finally {
      setSendingReply(false);
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  // ============================================
  // SETTINGS FUNCTIONS
  // ============================================

  const loadEmailSettings = async () => {
    if (!user?.uid) return;

    setLoadingSettings(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'email_settings', user.uid));
      if (settingsDoc.exists()) {
        setEmailSettings(settingsDoc.data() as EmailSettings);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveEmailSettings = async () => {
    if (!user?.uid) return;

    setSavingSettings(true);
    try {
      const settingsToSave = {
        ...emailSettings,
        id: user.uid,
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'email_settings', user.uid), settingsToSave);
      setStatus({ type: 'success', message: 'Instellingen opgeslagen!' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setStatus({ type: 'error', message: 'Kon instellingen niet opslaan' });
    } finally {
      setSavingSettings(false);
    }
  };

  // ============================================
  // SENT EMAILS FUNCTIONS
  // ============================================

  const loadSentEmails = async () => {
    setLoadingSent(true);
    try {
      const q = query(
        collection(db, 'sent_emails'),
        orderBy('sent_at', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const emails = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SentEmail));
      setSentEmails(emails);
    } catch (error) {
      console.error('Error loading sent emails:', error);
    } finally {
      setLoadingSent(false);
    }
  };

  const handleDeleteSentEmail = async (emailId: string) => {
    if (!confirm('Weet je zeker dat je deze email wilt verwijderen?')) return;

    try {
      await deleteDoc(doc(db, 'sent_emails', emailId));
      setSentEmails(prev => prev.filter(e => e.id !== emailId));
      setStatus({ type: 'success', message: 'Email verwijderd' });
      setTimeout(() => setStatus({ type: null, message: '' }), 2000);
    } catch (error) {
      console.error('Error deleting email:', error);
      setStatus({ type: 'error', message: 'Kon email niet verwijderen' });
    }
  };

  // ============================================
  // COMPOSE FUNCTIONS
  // ============================================

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): string | null => {
    if (!formData.to.trim()) {
      return 'Email adres is verplicht';
    }
    if (!validateEmail(formData.to)) {
      return 'Ongeldig email adres';
    }
    if (!formData.subject.trim()) {
      return 'Onderwerp is verplicht';
    }
    if (!formData.message.trim()) {
      return 'Bericht is verplicht';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    if (!user) return;

    setLoading(true);
    setStatus({ type: null, message: '' });

    // Add signature if enabled
    const isHtmlMode = composeMode === 'html';
    let messageWithSignature = formData.message;
    if (emailSettings.signature_enabled && emailSettings.signature) {
      if (isHtmlMode) {
        messageWithSignature += `<br><br><div class="email-signature" style="border-top:1px solid #ccc;padding-top:12px;margin-top:12px;color:#666;">${emailSettings.signature.replace(/\n/g, '<br>')}</div>`;
      } else {
        messageWithSignature += '\n\n' + emailSettings.signature;
      }
    }

    // Converteer bijlagen naar base64
    const attachmentData: { name: string; data: string; type: string }[] = [];
    for (const file of attachments) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      attachmentData.push({ name: file.name, data: base64, type: file.type });
    }

    try {
      const response = await fetch('https://internedata.nl/uploads/vlottr/mail/send.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          message: messageWithSignature,
          isHtml: isHtmlMode,
          ...(attachmentData.length > 0 && { attachments: attachmentData }),
        }),
      });

      const data = await response.json();

      // Save to Firebase (remove undefined fields to prevent Firebase errors)
      const emailRecord: any = {
        from: 'noreply@vlottr.nl', // System email
        to: formData.to,
        subject: formData.subject,
        message: formData.message,
        status: data.success ? 'sent' : 'failed',
        sent_by: user.uid,
        sent_by_name: user.name,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Only add optional fields if they have values
      if (emailSettings.signature_enabled && emailSettings.signature) {
        emailRecord.signature = emailSettings.signature;
      }
      if (!data.success && data.error) {
        emailRecord.error = data.error;
      }

      await addDoc(collection(db, 'sent_emails'), emailRecord);

      if (data.success) {
        setStatus({ type: 'success', message: 'Email succesvol verzonden!' });
        setFormData({ to: '', subject: '', message: '' });
        setAttachments([]);
        // Close compose modal after brief success feedback
        setTimeout(() => setComposeModalOpen(false), 1000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Er is iets misgegaan bij het verzenden' });
      }
    } catch (error) {
      console.error('Email send error:', error);

      // Still save failed attempt to Firebase
      try {
        const emailRecord: any = {
          from: 'noreply@vlottr.nl',
          to: formData.to,
          subject: formData.subject,
          message: formData.message,
          status: 'failed',
          error: 'Netwerkfout: Kon geen verbinding maken',
          sent_by: user.uid,
          sent_by_name: user.name,
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        // Only add signature if it exists
        if (emailSettings.signature_enabled && emailSettings.signature) {
          emailRecord.signature = emailSettings.signature;
        }

        await addDoc(collection(db, 'sent_emails'), emailRecord);
      } catch (dbError) {
        console.error('Failed to save error to database:', dbError);
      }

      setStatus({
        type: 'error',
        message: 'Netwerkfout: Kon geen verbinding maken met de email server'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (status.type) {
      setStatus({ type: null, message: '' });
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  // Filtered + sorted inbox emails (always excludes archived)
  const filteredEmails = useMemo(() => {
    let filtered = inboxEmails.filter(e => !e.archived);
    if (filterRead === 'unread') filtered = filtered.filter(e => !e.isRead);
    if (filterRead === 'read') filtered = filtered.filter(e => e.isRead);
    filtered.sort((a, b) => {
      const rawA = new Date(a.date).getTime();
      const rawB = new Date(b.date).getTime();
      const timeA = isNaN(rawA) ? new Date(a.fetched_at || 0).getTime() : rawA;
      const timeB = isNaN(rawB) ? new Date(b.fetched_at || 0).getTime() : rawB;
      return filterSort === 'newest' ? timeB - timeA : timeA - timeB;
    });
    return filtered;
  }, [inboxEmails, filterSort, filterRead]);

  // Emails in selected archive folder (sorted newest first)
  const folderEmails = useMemo(() => {
    if (!selectedFolder) return [];
    return inboxEmails
      .filter(e => e.archived && e.archiveFolder === selectedFolder.id)
      .sort((a, b) => {
        const rawA = new Date(a.date).getTime();
        const rawB = new Date(b.date).getTime();
        const timeA = isNaN(rawA) ? new Date(a.fetched_at || 0).getTime() : rawA;
        const timeB = isNaN(rawB) ? new Date(b.fetched_at || 0).getTime() : rawB;
        return timeB - timeA;
      });
  }, [inboxEmails, selectedFolder]);

  // Email count per folder (for folder cards)
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inboxEmails.forEach(e => {
      if (e.archived && e.archiveFolder) {
        counts[e.archiveFolder] = (counts[e.archiveFolder] || 0) + 1;
      }
    });
    return counts;
  }, [inboxEmails]);

  // Parent folder of currently selected folder (for subfolder back navigation)
  const parentFolder = useMemo(() =>
    selectedFolder?.parentId
      ? archiveFolders.find(f => f.id === selectedFolder.parentId) || null
      : null,
    [selectedFolder, archiveFolders]
  );

  // Build a sandboxed HTML document for iframe rendering of email bodies
  const buildEmailDoc = (body: string, isHtml: boolean): string => {
    const content = isHtml
      ? DOMPurify.sanitize(body, {
          ALLOWED_TAGS: ['p','br','strong','em','u','s','b','i','h1','h2','h3','h4','h5','h6',
            'ul','ol','li','blockquote','a','img','table','thead','tbody','tr','th','td',
            'div','span','pre','code','hr','small','sub','sup','style','font','center'],
          ALLOWED_ATTR: ['href','src','alt','title','class','style','target','rel',
            'width','height','align','valign','colspan','rowspan','color','bgcolor','border','cellpadding','cellspacing'],
          FORCE_BODY: true,
          ADD_TAGS: ['style'],
        })
      : body
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;background:transparent;line-height:1.6;font-size:14px;word-break:break-word;padding:4px 0;}
  a{color:#22c55e;}
  img{max-width:100%;height:auto;border-radius:4px;}
  table{max-width:100%;border-collapse:collapse;}
  td,th{padding:4px 8px;}
  pre{white-space:pre-wrap;background:#1a1a1a;padding:12px;border-radius:6px;font-size:12px;}
  blockquote{border-left:3px solid #22c55e;padding-left:12px;color:#a3a3a3;margin:8px 0;}
  h1,h2,h3,h4,h5,h6{color:#fff;margin:8px 0 4px;}
  p{margin:4px 0;}
</style>
<script>
(function(){
  function notifyHeight(){
    window.parent.postMessage({type:'resize',height:document.body.scrollHeight},'*');
  }
  window.addEventListener('load',notifyHeight);
  if(window.ResizeObserver){new ResizeObserver(notifyHeight).observe(document.body);}
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a');
    if(a&&a.href&&a.href.indexOf('mailto:')<0&&a.href.indexOf('javascript:')<0){
      e.preventDefault();
      window.parent.postMessage({type:'link',url:a.href},'*');
    }
  });
})();
</script>
</head>
<body>${content}</body>
</html>`;
  };

  const openAttachmentPreview = (attachment: EmailAttachment) => {
    setPreviewAttachment(attachment);
  };

  const downloadAttachment = (attachment: EmailAttachment) => {
    const binary = atob(attachment.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: attachment.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 1) return 'Nu';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}u`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 4) return `${diffWeeks}w`;

    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const unreadCount = inboxEmails.filter(e => !e.isRead && !e.archived).length;

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Email Management" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-6xl mx-auto">
            {/* Tabs + Inbox filter in één balk */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
              {/* Tab knoppen */}
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
                {/* Nieuwe email — opent compose modal */}
                <button
                  onClick={() => {
                    setFormData({ to: '', subject: '', message: '' });
                    setComposeMode('html');
                    setComposeModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base bg-green-500 hover:bg-green-400 text-neutral-950"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline"></span>
                </button>
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base relative ${
                    activeTab === 'inbox'
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <InboxIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Inbox</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                    activeTab === 'sent'
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Verzonden</span>
                </button>
                <button
                  onClick={() => { setActiveTab('archive'); setSelectedFolder(null); }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                    activeTab === 'archive'
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Archief</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                    activeTab === 'settings'
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Instellingen</span>
                </button>

                {/* Read filter — inline met de tab knoppen, alleen bij inbox */}
                {activeTab === 'inbox' && (
                  <div className="flex rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800">
                    {(['all', 'unread', 'read'] as const).map(val => (
                      <button
                        key={val}
                        onClick={() => setFilterRead(val)}
                        className={`px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                          filterRead === val
                            ? 'bg-neutral-600 text-white'
                            : 'text-neutral-400 hover:text-neutral-300'
                        }`}
                      >
                        {val === 'all' ? 'Alle' : val === 'unread' ? 'Ongelezen' : 'Gelezen'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {status.type && (
              <div
                className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base ${
                  status.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                )}
                <p className={status.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                  {status.message}
                </p>
              </div>
            )}

            {/* Inbox Tab */}
            {activeTab === 'inbox' && (
              <div className="vl-card rounded-xl border border-white/[0.1] overflow-hidden">
                <div className="p-3 sm:p-4 lg:p-6 border-b border-white/[0.1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Inbox</h3>
                    {lastFetchedAt && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Update: {formatDate(lastFetchedAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={fetchInboxEmails}
                    disabled={loadingInbox}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-neutral-950 rounded-lg font-medium transition-all disabled:opacity-50 text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingInbox ? 'animate-spin' : ''}`} />
                    {loadingInbox ? 'Laden...' : 'Ophalen'}
                  </button>
                </div>

                {loadingInbox && inboxEmails.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-green-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-neutral-400">Emails ophalen...</p>
                  </div>
                ) : inboxError && inboxEmails.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-red-400 mb-2">Fout bij ophalen</p>
                    <p className="text-xs sm:text-sm text-neutral-500 mb-3">{inboxError}</p>
                    {inboxError.includes('500') && (
                      <p className="text-xs text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2 max-w-xs mx-auto">
                        inbox.php op de server geeft een fout terug. Controleer of de nieuwe versie is gedeployed op internedata.nl.
                      </p>
                    )}
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <InboxIcon className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-neutral-400">
                      {filterRead !== 'all' ? 'Geen emails voor dit filter' : 'Geen emails'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => handleEmailClick(email)}
                        className={`p-3 sm:p-4 lg:p-5 hover:bg-white/[0.05] transition-colors cursor-pointer ${
                          !email.isRead ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              {!email.isRead && (
                                <Circle className="w-1.5 h-1.5 sm:w-2 sm:h-2 fill-blue-400 text-blue-400 flex-shrink-0" />
                              )}
                              <span className={`text-xs sm:text-sm truncate ${!email.isRead ? 'text-white font-medium' : 'text-neutral-400'}`}>
                                {email.from}
                              </span>
                              <span className="text-xs text-neutral-500 ml-auto flex-shrink-0">{formatDate(email.date)}</span>
                            </div>
                            <p className={`text-sm sm:text-base font-medium mb-1 truncate ${!email.isRead ? 'text-white' : 'text-neutral-300'}`}>
                              {email.subject || '(Geen onderwerp)'}
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-400 line-clamp-1">{email.preview}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEmailRead(email.id, email.isRead);
                              }}
                              className="p-1.5 sm:p-2 hover:bg-neutral-700 rounded-lg transition-colors group"
                              title={email.isRead ? 'Markeer als ongelezen' : 'Markeer als gelezen'}
                            >
                              {email.isRead ? (
                                <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 group-hover:text-neutral-400" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-300" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setArchiveModalEmail(email.id);
                              }}
                              className="p-1.5 sm:p-2 hover:bg-yellow-500/10 rounded-lg transition-colors group"
                              title="Archiveren"
                            >
                              <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 group-hover:text-yellow-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteInboxEmail(email.id);
                              }}
                              className="p-1.5 sm:p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sent Tab */}
            {activeTab === 'sent' && (
              <div className="vl-card rounded-xl border border-white/[0.1] overflow-hidden">
                <div className="p-3 sm:p-4 lg:p-6 border-b border-white/[0.1] flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Verzonden</h3>
                  <button
                    onClick={loadSentEmails}
                    disabled={loadingSent}
                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-all disabled:opacity-50 text-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingSent ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Vernieuw</span>
                  </button>
                </div>

                {loadingSent ? (
                  <div className="p-8 sm:p-12 text-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-green-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-neutral-400">Laden...</p>
                  </div>
                ) : sentEmails.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-neutral-400">Geen emails verzonden</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {sentEmails.map((email) => (
                      <div
                        key={email.id}
                        className="p-3 sm:p-4 lg:p-5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelectedSentEmail(email)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                email.status === 'sent'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {email.status === 'sent' ? <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                {email.status === 'sent' ? 'Verzonden' : 'Mislukt'}
                              </span>
                              <span className="text-xs text-neutral-500">{formatDate(email.sent_at)}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-400 mb-1">
                              Naar: <span className="text-white">{email.to}</span>
                            </p>
                            <p className="text-sm sm:text-base text-white font-medium mb-1.5 truncate">{email.subject}</p>
                            <p className="text-xs sm:text-sm text-neutral-500 line-clamp-1">
                              {email.sent_by_name || 'Systeem'}
                            </p>
                            {email.error && (
                              <p className="text-xs text-red-400 mt-1.5">Error: {email.error}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedSentEmail(email); }}
                              className="p-1.5 sm:p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                              title="Bekijken"
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 hover:text-white" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteSentEmail(email.id); }}
                              className="p-1.5 sm:p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="vl-card rounded-xl p-4 sm:p-6 lg:p-8 border border-white/[0.1]">
                {loadingSettings ? (
                  <div className="py-8 sm:py-12 text-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-green-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-neutral-400">Laden...</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Email Handtekening</h3>

                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <button
                          onClick={() => setEmailSettings(prev => ({ ...prev, signature_enabled: !prev.signature_enabled }))}
                          className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                            emailSettings.signature_enabled ? 'bg-green-500' : 'bg-neutral-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                              emailSettings.signature_enabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs sm:text-sm text-neutral-300">
                          Handtekening automatisch toevoegen
                        </span>
                      </div>

                      <textarea
                        value={emailSettings.signature}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, signature: e.target.value }))}
                        placeholder="Bijv.&#10;&#10;Met vriendelijke groet,&#10;[Naam]&#10;VLOTTR&#10;info@vlottr.nl"
                        rows={6}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none font-mono text-xs sm:text-sm"
                      />

                      <p className="text-xs text-neutral-500 mt-2">
                        Deze handtekening wordt automatisch toegevoegd aan het einde van je emails.
                      </p>
                    </div>

                    <button
                      onClick={saveEmailSettings}
                      disabled={savingSettings}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-neutral-950 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Opslaan...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          Instellingen Opslaan
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Archive Tab */}
            {activeTab === 'archive' && (() => {
              const isSubfolder = !!selectedFolder?.parentId;
              const subfolders = selectedFolder && !isSubfolder
                ? archiveFolders.filter(f => f.parentId === selectedFolder.id)
                : [];
              const rootFolders = archiveFolders.filter(f => !f.parentId);

              return (
                <div className="vl-card rounded-xl border border-white/[0.1] overflow-hidden">
                  {/* Header */}
                  <div className="p-3 sm:p-4 lg:p-6 border-b border-white/[0.1] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedFolder && (
                        <button
                          onClick={() => setSelectedFolder(isSubfolder ? parentFolder : null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-all"
                        >
                          ← Terug
                        </button>
                      )}
                      {/* Breadcrumb */}
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className={selectedFolder ? 'text-neutral-500' : 'text-white font-semibold text-base sm:text-lg'}>Archief</span>
                        {parentFolder && <><span className="text-neutral-600">›</span><span className="text-neutral-400">{parentFolder.name}</span></>}
                        {selectedFolder && <><span className="text-neutral-600">›</span><span className="text-white font-semibold">{selectedFolder.name}</span></>}
                      </div>
                      {selectedFolder && (
                        <span className="text-xs text-neutral-500">({folderEmails.length} email{folderEmails.length !== 1 ? 's' : ''})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Inline input for root folder */}
                      {!selectedFolder && showFolderInput === 'root' && (
                        <>
                          <input
                            autoFocus
                            type="text"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && newFolderName.trim()) {
                                await createArchiveFolder(newFolderName);
                                setShowFolderInput(null);
                              }
                              if (e.key === 'Escape') { setShowFolderInput(null); setNewFolderName(''); }
                            }}
                            placeholder="bijv. Q1 2026"
                            className="w-36 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          />
                          <button
                            disabled={!newFolderName.trim() || creatingFolder}
                            onClick={async () => {
                              if (newFolderName.trim()) {
                                await createArchiveFolder(newFolderName);
                                setShowFolderInput(null);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-neutral-950 rounded-lg font-medium text-sm transition-all"
                          >
                            {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                            OK
                          </button>
                          <button onClick={() => { setShowFolderInput(null); setNewFolderName(''); }} className="p-2 text-neutral-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!selectedFolder && showFolderInput !== 'root' && (
                        <button
                          onClick={() => { setShowFolderInput('root'); setNewFolderName(''); }}
                          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-400 text-neutral-950 rounded-lg font-medium text-sm transition-all"
                        >
                          <FolderPlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Nieuwe map</span>
                        </button>
                      )}

                      {/* Inline input for submap */}
                      {selectedFolder && !isSubfolder && showFolderInput === 'sub' && (
                        <>
                          <input
                            autoFocus
                            type="text"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && newFolderName.trim()) {
                                await createArchiveFolder(newFolderName, selectedFolder.id);
                                setShowFolderInput(null);
                              }
                              if (e.key === 'Escape') { setShowFolderInput(null); setNewFolderName(''); }
                            }}
                            placeholder="bijv. Facturen"
                            className="w-36 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          />
                          <button
                            disabled={!newFolderName.trim() || creatingFolder}
                            onClick={async () => {
                              if (newFolderName.trim()) {
                                await createArchiveFolder(newFolderName, selectedFolder.id);
                                setShowFolderInput(null);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-all"
                          >
                            {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                            OK
                          </button>
                          <button onClick={() => { setShowFolderInput(null); setNewFolderName(''); }} className="p-2 text-neutral-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {selectedFolder && !isSubfolder && showFolderInput !== 'sub' && (
                        <button
                          onClick={() => { setShowFolderInput('sub'); setNewFolderName(''); }}
                          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium text-sm transition-all"
                        >
                          <FolderPlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Nieuwe submap</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Root view: folder grid */}
                  {!selectedFolder && (
                    loadingFolders ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
                        <p className="text-neutral-400">Laden...</p>
                      </div>
                    ) : rootFolders.length === 0 ? (
                      <div className="p-12 text-center">
                        <Archive className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                        <p className="text-neutral-400 mb-2">Geen archiefmappen</p>
                        <p className="text-sm text-neutral-500">Maak een map aan om emails in te archiveren.</p>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {rootFolders.map(folder => {
                          const subCount = archiveFolders.filter(f => f.parentId === folder.id).length;
                          return (
                            <div
                              key={folder.id}
                              className="group relative bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 cursor-pointer transition-all"
                              onClick={() => setSelectedFolder(folder)}
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <FolderOpen className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteArchiveFolder(folder.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                                  title="Map verwijderen"
                                >
                                  <FolderX className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                              <p className="text-white font-semibold text-sm mb-1 truncate">{folder.name}</p>
                              <p className="text-xs text-neutral-500">
                                {folderCounts[folder.id] || 0} email{(folderCounts[folder.id] || 0) !== 1 ? 's' : ''}
                                {subCount > 0 && <span className="ml-2">· {subCount} submap{subCount !== 1 ? 'pen' : ''}</span>}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}

                  {/* Folder view: subfolders + emails */}
                  {selectedFolder && !isSubfolder && (
                    <div>
                      {/* Subfolders row */}
                      {subfolders.length > 0 && (
                        <div className="p-3 sm:p-4 border-b border-white/[0.05]">
                          <p className="text-xs text-neutral-500 mb-2 px-1">Submappen</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {subfolders.map(sub => (
                              <div
                                key={sub.id}
                                className="group flex items-center gap-2 p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg cursor-pointer transition-all"
                                onClick={() => setSelectedFolder(sub)}
                              >
                                <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{sub.name}</p>
                                  <p className="text-[10px] text-neutral-600">{folderCounts[sub.id] || 0} emails</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteArchiveFolder(sub.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                                  title="Submap verwijderen"
                                >
                                  <FolderX className="w-3.5 h-3.5 text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Emails in this folder */}
                      {folderEmails.length === 0 ? (
                        <div className="p-10 text-center">
                          <Folder className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                          <p className="text-neutral-400 text-sm">Geen emails direct in deze map</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.05]">
                          {folderEmails.map(email => (
                            <div key={email.id} className="p-3 sm:p-4 lg:p-5 hover:bg-white/[0.03] transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEmailClick(email)}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs sm:text-sm text-neutral-400 truncate">{email.from}</span>
                                    <span className="text-xs text-neutral-600 ml-auto flex-shrink-0">{formatDate(email.date)}</span>
                                  </div>
                                  <p className="text-sm sm:text-base font-medium text-neutral-300 mb-1 truncate">{email.subject || '(Geen onderwerp)'}</p>
                                  <p className="text-xs text-neutral-500 line-clamp-1">{email.preview}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button onClick={() => setMoveModalEmail(email)} className="p-1.5 sm:p-2 hover:bg-blue-500/10 rounded-lg transition-colors group" title="Verplaatsen"><MoveRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 group-hover:text-blue-400" /></button>
                                  <button onClick={() => unarchiveEmail(email.id)} className="p-1.5 sm:p-2 hover:bg-green-500/10 rounded-lg transition-colors group" title="Terugzetten naar inbox"><ArchiveRestore className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 group-hover:text-green-400" /></button>
                                  <button onClick={() => deleteInboxEmail(email.id)} className="p-1.5 sm:p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Verwijderen"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 hover:text-red-400" /></button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subfolder view: only emails */}
                  {selectedFolder && isSubfolder && (
                    folderEmails.length === 0 ? (
                      <div className="p-12 text-center">
                        <Folder className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                        <p className="text-neutral-400">Geen emails in deze submap</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.05]">
                        {folderEmails.map(email => (
                          <div key={email.id} className="p-3 sm:p-4 lg:p-5 hover:bg-white/[0.03] transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEmailClick(email)}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs sm:text-sm text-neutral-400 truncate">{email.from}</span>
                                  <span className="text-xs text-neutral-600 ml-auto flex-shrink-0">{formatDate(email.date)}</span>
                                </div>
                                <p className="text-sm sm:text-base font-medium text-neutral-300 mb-1 truncate">{email.subject || '(Geen onderwerp)'}</p>
                                <p className="text-xs text-neutral-500 line-clamp-1">{email.preview}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => setMoveModalEmail(email)} className="p-1.5 sm:p-2 hover:bg-blue-500/10 rounded-lg transition-colors group" title="Verplaatsen"><MoveRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 group-hover:text-blue-400" /></button>
                                <button onClick={() => unarchiveEmail(email.id)} className="p-1.5 sm:p-2 hover:bg-green-500/10 rounded-lg transition-colors group" title="Terugzetten naar inbox"><ArchiveRestore className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 group-hover:text-green-400" /></button>
                                <button onClick={() => deleteInboxEmail(email.id)} className="p-1.5 sm:p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Verwijderen"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 hover:text-red-400" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              );
            })()}

          </div>
        </main>
      </div>
      <BottomNav />

      {/* Compose Modal */}
      {composeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="vl-card rounded-xl border border-white/[0.1] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.1] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-white">Nieuwe email</h2>
                {/* Mode toggle */}
                <div className="inline-flex rounded-lg bg-neutral-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => { setComposeMode('html'); setFormData(prev => ({ ...prev, message: '' })); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      composeMode === 'html' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-300'
                    }`}
                  >HTML</button>
                  <button
                    type="button"
                    onClick={() => { setComposeMode('plain'); setFormData(prev => ({ ...prev, message: '' })); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      composeMode === 'plain' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-300'
                    }`}
                  >Plain</button>
                </div>
              </div>
              <button
                onClick={() => setComposeModalOpen(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Ontvanger <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    placeholder="email@voorbeeld.nl"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Onderwerp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Email onderwerp"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Bericht <span className="text-red-400">*</span>
                  </label>
                  {composeMode === 'plain' ? (
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Typ hier je bericht..."
                      rows={10}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 resize-none font-mono text-xs"
                    />
                  ) : (
                    <div className="quill-dark rounded-lg overflow-hidden border border-neutral-700">
                      <ReactQuill
                        theme="snow"
                        value={formData.message}
                        onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                        placeholder="Typ hier je bericht..."
                        readOnly={loading}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ color: [] }, { background: [] }],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            ['link', 'image'],
                            ['blockquote', 'code-block'],
                            ['clean'],
                          ],
                        }}
                        formats={['header','bold','italic','underline','strike','color','background',
                          'list','bullet','indent','link','image','blockquote','code-block']}
                        style={{ minHeight: '200px' }}
                      />
                    </div>
                  )}
                  {/* Signature preview */}
                  {emailSettings.signature_enabled && emailSettings.signature && (
                    <div className="mt-2 border-t border-neutral-700 pt-2">
                      <p className="text-xs text-neutral-500 mb-1">Handtekening (automatisch toegevoegd):</p>
                      {composeMode === 'html' ? (
                        <div
                          className="text-xs text-neutral-400"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(emailSettings.signature.replace(/\n/g, '<br>')) }}
                        />
                      ) : (
                        <pre className="text-xs text-neutral-400 whitespace-pre-wrap">{emailSettings.signature}</pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Bijlagen */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Bijlagen</label>
                  <input
                    id="compose-attachments"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setAttachments(prev => [...prev, ...files]);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('compose-attachments')?.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 text-sm transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Bestand toevoegen
                  </button>
                  {attachments.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {attachments.map((file, i) => (
                        <li key={i} className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 rounded-lg text-xs">
                          <Paperclip className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="flex-1 truncate text-neutral-300">{file.name}</span>
                          <span className="text-neutral-600">{(file.size / 1024).toFixed(0)} KB</span>
                          <button
                            type="button"
                            onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                            className="p-0.5 hover:text-red-400 text-neutral-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Status feedback */}
                {status.type && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {status.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    {status.message}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setComposeModalOpen(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-all"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-neutral-950 rounded-lg font-semibold text-sm transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? 'Verzenden...' : 'Verzend Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="vl-card rounded-xl border border-white/[0.1] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/[0.1] flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">{selectedEmail.subject || '(Geen onderwerp)'}</h2>
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <p className="text-neutral-400 truncate">
                    <span className="text-neutral-500">Van:</span> <span className="text-white">{selectedEmail.from}</span>
                  </p>
                  <p className="text-neutral-400 truncate">
                    <span className="text-neutral-500">Aan:</span> <span className="text-white">{selectedEmail.to}</span>
                  </p>
                  <p className="text-neutral-400">
                    <span className="text-neutral-500">Datum:</span> {new Date(selectedEmail.date).toLocaleString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEmailDetail}
                className="flex-shrink-0 p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <iframe
                key={selectedEmail.id}
                srcDoc={buildEmailDoc(selectedEmail.body, selectedEmail.isHtml)}
                sandbox="allow-scripts"
                className="w-full border-0 block"
                style={{ height: `${iframeHeight}px`, minHeight: '200px' }}
                title="Email inhoud"
              />

              {/* Bijlagen */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="border-t border-white/[0.08] pt-4">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    {selectedEmail.attachments.length} bijlage{selectedEmail.attachments.length !== 1 ? 'n' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => {
                      const isImage = att.type.startsWith('image/');
                      const isPdf = att.type === 'application/pdf';
                      return (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-white/[0.08] transition-colors group">
                          {isImage
                            ? <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            : isPdf
                            ? <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                            : <Paperclip className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          }
                          <button
                            onClick={() => openAttachmentPreview(att)}
                            className="text-sm text-white truncate max-w-[160px] text-left hover:text-green-400 transition-colors"
                            title={att.name}
                          >
                            {att.name}
                          </button>
                          <span className="text-xs text-neutral-500 flex-shrink-0">{formatFileSize(att.size)}</span>
                          <button
                            onClick={() => downloadAttachment(att)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-green-400 text-neutral-400"
                            title="Downloaden"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-white/[0.1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => {
                    toggleEmailRead(selectedEmail.id, selectedEmail.isRead);
                    if (!selectedEmail.isRead) setSelectedEmail(null);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-all text-sm"
                >
                  {selectedEmail.isRead ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Markeer ongelezen
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Markeer gelezen
                    </>
                  )}
                </button>
                <button
                  onClick={() => { openReplyModal(selectedEmail); setSelectedEmail(null); }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all text-sm"
                >
                  <Send className="w-4 h-4" />
                  Beantwoorden
                </button>
                <button
                  onClick={() => setArchiveModalEmail(selectedEmail.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all text-sm"
                >
                  <Archive className="w-4 h-4" />
                  Archiveren
                </button>
              </div>
              <button
                onClick={() => {
                  deleteInboxEmail(selectedEmail.id);
                  closeEmailDetail();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Folder Selection Modal */}
      {archiveModalEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="vl-card rounded-xl border border-white/[0.1] w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/[0.1] flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-white">Email archiveren</h3>
              <button onClick={() => setArchiveModalEmail(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-neutral-400">Kies een map om de email in te archiveren:</p>

              {archiveFolders.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">Nog geen mappen. Maak er eerst een aan.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {archiveFolders.filter(f => !f.parentId).map(rootFolder => (
                    <React.Fragment key={rootFolder.id}>
                      <button
                        onClick={() => archiveEmailToFolder(archiveModalEmail, rootFolder.id)}
                        className="w-full flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-green-500/30 rounded-lg transition-all text-left"
                      >
                        <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{rootFolder.name}</p>
                          <p className="text-xs text-neutral-500">{folderCounts[rootFolder.id] || 0} emails</p>
                        </div>
                      </button>
                      {archiveFolders.filter(f => f.parentId === rootFolder.id).map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => archiveEmailToFolder(archiveModalEmail, sub.id)}
                          className="w-full flex items-center gap-3 p-2.5 ml-5 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-green-500/30 rounded-lg transition-all text-left"
                        >
                          <FolderOpen className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{sub.name}</p>
                            <p className="text-xs text-neutral-500">{folderCounts[sub.id] || 0} emails</p>
                          </div>
                        </button>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* New folder inline */}
              <div className="border-t border-neutral-800 pt-4">
                <p className="text-xs text-neutral-500 mb-2">Nieuwe map aanmaken:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        const folder = await createArchiveFolder(newFolderName);
                        if (folder) archiveEmailToFolder(archiveModalEmail, folder.id);
                      }
                    }}
                    placeholder="bijv. Q1 2026"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <button
                    disabled={!newFolderName.trim() || creatingFolder}
                    onClick={async () => {
                      const folder = await createArchiveFolder(newFolderName);
                      if (folder) archiveEmailToFolder(archiveModalEmail, folder.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-neutral-950 rounded-lg font-medium text-sm transition-all"
                  >
                    {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                    Aanmaken
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Email to Folder Modal */}
      {moveModalEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="vl-card rounded-xl border border-white/[0.1] w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/[0.1] flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">Email verplaatsen</h3>
                <p className="text-xs text-neutral-500 truncate mt-0.5">{moveModalEmail.subject || '(Geen onderwerp)'}</p>
              </div>
              <button onClick={() => setMoveModalEmail(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-neutral-400">Verplaats naar een andere map:</p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {archiveFolders
                  .filter(f => f.id !== moveModalEmail.archiveFolder)
                  .map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => moveEmailToFolder(moveModalEmail.id, folder.id)}
                      className="w-full flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-blue-500/30 rounded-lg transition-all text-left"
                    >
                      <FolderOpen className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">{folder.name}</p>
                        <p className="text-xs text-neutral-500">{folderCounts[folder.id] || 0} emails</p>
                      </div>
                    </button>
                  ))}
              </div>

              {/* New folder inline */}
              <div className="border-t border-neutral-800 pt-4">
                <p className="text-xs text-neutral-500 mb-2">Nieuwe map aanmaken:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        const folder = await createArchiveFolder(newFolderName);
                        if (folder) moveEmailToFolder(moveModalEmail.id, folder.id);
                      }
                    }}
                    placeholder="bijv. Q2 2026"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <button
                    disabled={!newFolderName.trim() || creatingFolder}
                    onClick={async () => {
                      const folder = await createArchiveFolder(newFolderName);
                      if (folder) moveEmailToFolder(moveModalEmail.id, folder.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-all"
                  >
                    {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                    Aanmaken
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="vl-card rounded-xl border border-white/[0.1] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-white/[0.1] flex items-center justify-between flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-white">Beantwoorden</h3>
              <button onClick={() => { setReplyEmail(null); setReplyMessage(''); }} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {/* To */}
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Aan</label>
                <input
                  type="text"
                  value={extractEmailAddress(replyEmail.from)}
                  readOnly
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm opacity-70 cursor-default"
                />
              </div>
              {/* Subject */}
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Onderwerp</label>
                <input
                  type="text"
                  value={replyEmail.subject.startsWith('Re:') ? replyEmail.subject : `Re: ${replyEmail.subject}`}
                  readOnly
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm opacity-70 cursor-default"
                />
              </div>
              {/* Message editor */}
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Bericht</label>
                <div className="border border-neutral-700 rounded-lg overflow-hidden" style={{ minHeight: '220px' }}>
                  <ReactQuill
                    value={replyMessage}
                    onChange={setReplyMessage}
                    theme="snow"
                    style={{ height: '180px' }}
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                        ['clean'],
                      ],
                    }}
                  />
                </div>
              </div>
              {/* Include quote toggle */}
              <label className="flex items-center gap-2.5 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeQuote}
                  onChange={(e) => setIncludeQuote(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 accent-green-500"
                />
                <span className="text-xs text-neutral-400">Voorgaande mail bijvoegen onder handtekening</span>
              </label>

              {/* Quoted original preview */}
              {includeQuote && (
                <div className="text-xs text-neutral-500 pl-3 border-l-2 border-neutral-700 space-y-1 mt-2 max-h-[150px] overflow-y-auto">
                  <p className="font-medium">Op {new Date(replyEmail.date).toLocaleString('nl-NL')} schreef {replyEmail.from}:</p>
                  {replyEmail.isHtml ? (
                    <div
                      className="opacity-70 text-neutral-500 [&_*]:!text-neutral-500 [&_*]:!text-xs"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(replyEmail.body, { ALLOWED_TAGS: ['p','br','strong','em','b','i','ul','ol','li','div','span','a','h1','h2','h3','h4','h5','h6','table','tr','td','th','hr'], ALLOWED_ATTR: [] }) }}
                    />
                  ) : (
                    <p className="opacity-70 whitespace-pre-wrap">{replyEmail.body}</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-white/[0.1] flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => { setReplyEmail(null); setReplyMessage(''); }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={sendReply}
                disabled={sendingReply || !replyMessage.replace(/<[^>]*>/g, '').trim()}
                className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg text-sm transition-all"
              >
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Verzenden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sent Email Viewer Modal */}
      {selectedSentEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="vl-card rounded-xl border border-white/[0.1] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/[0.1] flex items-start justify-between gap-4 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">{selectedSentEmail.subject || '(Geen onderwerp)'}</h2>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p>
                    <span className="text-neutral-500">Naar:</span> <span className="text-white">{selectedSentEmail.to}</span>
                  </p>
                  <p>
                    <span className="text-neutral-500">Datum:</span> {new Date(selectedSentEmail.sent_at).toLocaleString('nl-NL', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  <p>
                    <span className="text-neutral-500">Verzonden door:</span> <span className="text-white">{selectedSentEmail.sent_by_name || 'Systeem'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSentEmail(null)}
                className="flex-shrink-0 p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
              </button>
            </div>

            {/* Body - rendered HTML */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <iframe
                key={selectedSentEmail.id}
                srcDoc={buildEmailDoc(selectedSentEmail.message, true)}
                sandbox="allow-scripts"
                className="w-full border-0 block"
                style={{ height: `${iframeHeight}px`, minHeight: '300px' }}
                title="Email inhoud"
              />
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-white/[0.1] flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedSentEmail.status === 'sent'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {selectedSentEmail.status === 'sent' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {selectedSentEmail.status === 'sent' ? 'Verzonden' : 'Mislukt'}
                </span>
                {selectedSentEmail.error && (
                  <span className="text-xs text-red-400">{selectedSentEmail.error}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedSentEmail(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-all"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Preview Modal */}
      {linkPreviewUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-neutral-900 border-b border-white/[0.1] flex-shrink-0">
            <ExternalLink className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className="text-xs text-neutral-400 truncate flex-1 min-w-0">{linkPreviewUrl}</span>
            <a
              href={linkPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-all flex-shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              Openen in tab
            </a>
            <button
              onClick={() => setLinkPreviewUrl(null)}
              className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* iframe */}
          <div className="flex-1 relative">
            <iframe
              key={linkPreviewUrl}
              src={linkPreviewUrl}
              className="w-full h-full border-0"
              title="Link preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (() => {
        const att = previewAttachment;
        const isImage = att.type.startsWith('image/');
        const isPdf = att.type === 'application/pdf';
        const blobUrl = (() => {
          const binary = atob(att.data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return URL.createObjectURL(new Blob([bytes], { type: att.type }));
        })();
        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-neutral-900 border-b border-white/[0.1] flex-shrink-0">
              {isImage
                ? <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                : isPdf
                ? <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                : <Paperclip className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              }
              <span className="text-sm text-white truncate flex-1 min-w-0 font-medium">{att.name}</span>
              <span className="text-xs text-neutral-500 flex-shrink-0">{formatFileSize(att.size)}</span>
              <button
                onClick={() => downloadAttachment(att)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-all flex-shrink-0"
              >
                <Download className="w-3 h-3" />
                Downloaden
              </button>
              <button
                onClick={() => { URL.revokeObjectURL(blobUrl); setPreviewAttachment(null); }}
                className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              {isImage ? (
                <img
                  src={blobUrl}
                  alt={att.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : isPdf ? (
                <iframe
                  src={blobUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title={att.name}
                />
              ) : (
                <div className="text-center space-y-4">
                  <Paperclip className="w-12 h-12 text-neutral-600 mx-auto" />
                  <p className="text-neutral-400 text-sm">Geen preview beschikbaar voor dit bestandstype.</p>
                  <button
                    onClick={() => downloadAttachment(att)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-neutral-950 rounded-lg font-semibold text-sm transition-all mx-auto"
                  >
                    <Download className="w-4 h-4" />
                    Downloaden
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default EmailTool;
