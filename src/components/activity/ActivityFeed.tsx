import React, { useEffect, useState } from 'react';
import { Activity, User, Car, FileText, Calendar, Settings, MessageSquare, Wrench, TrendingUp, Clock } from 'lucide-react';
import { useActivityLogStore } from '../../store/activityLogStore';
import { ActivityLog } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ActivityFeedProps {
  userId?: string; // If provided, shows only user's activities
  role?: 'customer' | 'manager' | 'admin'; // If provided, shows only role's activities
  limit?: number;
  showFilters?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  role,
  limit = 10,
  showFilters = false
}) => {
  const { logs, loading, fetchRecentLogs, fetchLogsByUser, fetchLogsByRole } = useActivityLogStore();
  const [filter, setFilter] = useState<'all' | 'bookings' | 'cars' | 'contracts' | 'users'>('all');

  useEffect(() => {
    if (userId) {
      fetchLogsByUser(userId, limit);
    } else if (role) {
      fetchLogsByRole(role, limit);
    } else {
      fetchRecentLogs(limit);
    }
  }, [userId, role, limit]);

  const getActivityIcon = (action: string, entity_type?: string) => {
    if (action.includes('login') || action.includes('logout') || action.includes('register')) {
      return <User className="w-5 h-5" />;
    }

    switch (entity_type) {
      case 'booking':
        return <Calendar className="w-5 h-5" />;
      case 'car':
        return <Car className="w-5 h-5" />;
      case 'contract':
        return <FileText className="w-5 h-5" />;
      case 'user':
        return <User className="w-5 h-5" />;
      case 'settings':
        return <Settings className="w-5 h-5" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getActivityColor = (action: string) => {
    if (action.includes('create') || action.includes('register')) return 'text-green-400';
    if (action.includes('update') || action.includes('extend')) return 'text-blue-400';
    if (action.includes('delete') || action.includes('cancel') || action.includes('reject')) return 'text-red-400';
    if (action.includes('approve') || action.includes('complete') || action.includes('sign')) return 'text-green-400';
    if (action.includes('login')) return 'text-purple-400';
    return 'text-neutral-400';
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'bg-red-900/30 text-red-400 border-red-600/30';
      case 'manager':
        return 'bg-blue-900/30 text-blue-400 border-blue-600/30';
      case 'customer':
        return 'bg-green-900/30 text-green-400 border-green-600/30';
      default:
        return 'bg-neutral-900/30 text-neutral-400 border-neutral-600/30';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'bookings') return log.entity_type === 'booking';
    if (filter === 'cars') return log.entity_type === 'car';
    if (filter === 'contracts') return log.entity_type === 'contract';
    if (filter === 'users') return log.entity_type === 'user';
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: nl });
    } catch {
      return 'Onbekend';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Activity className="w-6 h-6 animate-spin text-green-400" />
        <span className="ml-2 text-neutral-400">Activiteiten laden...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-green-500 text-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Alles
          </button>
          <button
            onClick={() => setFilter('bookings')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'bookings'
                ? 'bg-green-500 text-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Boekingen
          </button>
          <button
            onClick={() => setFilter('cars')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'cars'
                ? 'bg-green-500 text-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Auto's
          </button>
          <button
            onClick={() => setFilter('contracts')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'contracts'
                ? 'bg-green-500 text-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Contracten
          </button>
          <button
            onClick={() => setFilter('users')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'users'
                ? 'bg-green-500 text-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Gebruikers
          </button>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">Nog geen activiteiten</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600/50 transition-colors"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 ${getActivityColor(log.action)}`}>
                {getActivityIcon(log.action, log.entity_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500">
                        {log.user_name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(log.user_role)}`}>
                        {log.user_role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-500 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(log.created_at)}
                  </div>
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-neutral-600">
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <span key={key} className="mr-3">
                        <strong>{key}:</strong> {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredLogs.length >= limit && (
        <button
          onClick={() => {
            const newLimit = limit + 10;
            if (userId) {
              fetchLogsByUser(userId, newLimit);
            } else if (role) {
              fetchLogsByRole(role, newLimit);
            } else {
              fetchRecentLogs(newLimit);
            }
          }}
          className="w-full mt-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          Meer laden...
        </button>
      )}
    </div>
  );
};

export default ActivityFeed;
