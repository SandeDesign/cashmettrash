import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useNavigate, useLocation } from 'react-router-dom';

const TourOverlay: React.FC = () => {
  const {
    isActive,
    currentTour,
    currentStepIndex,
    totalSteps,
    isMobile,
    nextStep,
    prevStep,
    skipTour,
    completeTour
  } = useOnboarding();

  const navigate = useNavigate();
  const location = useLocation();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Get filtered steps (based on mobile/desktop)
  const getFilteredSteps = () => {
    if (!currentTour) return [];
    return currentTour.steps.filter(step => {
      if (!step.showOn) return true;
      if (step.showOn === 'both') return true;
      if (step.showOn === 'mobile' && isMobile) return true;
      if (step.showOn === 'desktop' && !isMobile) return true;
      return false;
    });
  };

  const filteredSteps = getFilteredSteps();
  const currentStep = filteredSteps[currentStepIndex];

  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Check if we need to navigate to a different page
    if (currentStep.page && location.pathname !== currentStep.page) {
      navigate(currentStep.page);
      return; // Wait for navigation to complete
    }

    // Execute step action if defined (legacy support)
    if (currentStep.action) {
      currentStep.action();
    }

    // Find and highlight target element
    const isBodyTarget = currentStep.target === 'body';

    const updateHighlight = () => {
      if (isBodyTarget) {
        // For body target: show full dark overlay, no cutout
        setHighlightRect(null);
        return;
      }
      const targetElement = document.querySelector(currentStep.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position
        calculateTooltipPosition(rect);
      } else {
        console.warn(`Target element not found: ${currentStep.target}`);
        setHighlightRect(null);
      }
    };

    // Retry mechanism for async-loaded elements (e.g. cars grid, bookings)
    const retryDelays = [150, 400, 800, 1500, 2500];
    const retryTimers: ReturnType<typeof setTimeout>[] = [];

    if (!isBodyTarget) {
      updateHighlight();

      // Scroll to element
      const targetElement = document.querySelector(currentStep.target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Schedule retries in case element loads asynchronously
      retryDelays.forEach(delay => {
        retryTimers.push(setTimeout(() => {
          const el = document.querySelector(currentStep.target);
          if (el) {
            updateHighlight();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, delay));
      });
    } else {
      setHighlightRect(null);
    }

    // Re-calculate on resize
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      retryTimers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [currentStep, isActive, currentStepIndex, location.pathname]);

  const calculateTooltipPosition = (targetRect: DOMRect) => {
    if (!tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 20;
    const placement = currentStep?.placement || 'bottom';

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;

      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;

      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - padding;
        break;

      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + padding;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }

    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    setTooltipPosition({ top, left });
  };

  if (!isActive || !currentStep) return null;

  const isBodyStep = currentStep.target === 'body';
  const shouldCenterTooltip = isBodyStep || currentStep.centerTooltip;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with cutout */}
      <div className="absolute inset-0 pointer-events-auto">
        {/* SVG for cutout effect */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.x - (currentStep.highlightPadding || 8)}
                  y={highlightRect.y - (currentStep.highlightPadding || 8)}
                  width={highlightRect.width + (currentStep.highlightPadding || 8) * 2}
                  height={highlightRect.height + (currentStep.highlightPadding || 8) * 2}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.92)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlight border */}
        {highlightRect && (
          <div
            className="absolute border-4 border-green-500 rounded-lg shadow-2xl shadow-green-500 pointer-events-none animate-pulse"
            style={{
              top: highlightRect.y - (currentStep.highlightPadding || 8),
              left: highlightRect.x - (currentStep.highlightPadding || 8),
              width: highlightRect.width + (currentStep.highlightPadding || 8) * 2,
              height: highlightRect.height + (currentStep.highlightPadding || 8) * 2,
              transition: 'all 0.3s ease-in-out'
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={shouldCenterTooltip ? {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: isMobile ? 'calc(100vw - 40px)' : '420px',
          width: isMobile ? 'calc(100vw - 40px)' : '420px',
        } : {
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          maxWidth: isMobile ? 'calc(100vw - 40px)' : '400px',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div className="vl-card border-2 border-green-500 shadow-2xl shadow-green-500 p-6 rounded-xl" style={{ backgroundColor: '#0d0d0d' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{currentStep.title}</h3>
                <p className="text-xs text-green-400">
                  Stap {currentStepIndex + 1} van {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={skipTour}
              className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-neutral-300 leading-relaxed">
              {currentStep.content}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={prevStep}
              disabled={isFirstStep}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isFirstStep
                  ? 'opacity-30 cursor-not-allowed bg-neutral-800 text-neutral-600'
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Vorige
            </button>

            <button
              onClick={skipTour}
              className="px-4 py-2 rounded-lg font-medium transition-all text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              Overslaan
            </button>

            <button
              onClick={isLastStep ? completeTour : nextStep}
              className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 bg-green-500 text-black hover:bg-green-400"
            >
              {isLastStep ? (
                <>
                  Klaar!
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Volgende
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Arrow indicator */}
        {currentStep.placement === 'bottom' && highlightRect && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-green-500"
          />
        )}
        {currentStep.placement === 'top' && highlightRect && (
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-green-500"
          />
        )}
      </div>
    </div>
  );
};

export default TourOverlay;
