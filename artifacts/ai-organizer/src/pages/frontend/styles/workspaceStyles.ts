import React from "react";

const flexCenterGap14 = { display: 'flex' as const, alignItems: 'center' as const, gap: '14px' };
const flexCenterJustifyBetween = { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const };

// ── Shared style factory (used by both FrontendWorkspace & FrontendWorkspaceCompact) ──
export function createSharedStyles(isDark: boolean) {
  const modalOverlayStyle = {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const gradientPanelStyle = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
      : 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%)',
    backdropFilter: 'blur(20px)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.12)',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.1)' : '0 4px 16px rgba(99,102,241,0.06)'
  };

  const quickActionBtnStyle: React.CSSProperties = {
    background: isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99, 102, 241, 0.18)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
  };

  const viewModeButtonStyle = (isActive: boolean, _modeKey: string) => ({
    padding: '6px 12px',
    borderRadius: '8px',
    border: isActive ? 'none' : (isDark ? 'none' : '1px solid rgba(99,102,241,0.15)'),
    background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.35))' : (isDark ? 'transparent' : '#ffffff'),
    color: isActive ? '#fff' : (isDark ? 'rgba(255,255,255,0.6)' : '#2f2941'),
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.3)' : (isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'),
    outline: 'none',
  });

  const toggleButtonStyle = (isActive: boolean, isGreen: boolean = false) => ({
    background: isActive 
      ? (isGreen 
          ? (isDark ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.3) 100%)' : 'rgba(16, 185, 129, 0.1)')
          : (isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : 'rgba(99, 102, 241, 0.08)'))
      : (isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : '#ffffff'),
    border: isActive 
      ? (isGreen ? '1px solid rgba(34, 197, 94, 0.5)' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.25)'))
      : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.15)'),
    borderRadius: '8px',
    padding: '5px 12px',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
  });

  const segViewModeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive
      ? (isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.12)')
      : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'),
    color: isDark ? 'rgba(255, 255, 255, 0.8)' : (isActive ? '#4338ca' : '#2f2941'),
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(99,102,241,0.18)'}`,
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "11px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: 'none',
    boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
  });

  const segmentCardStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.04)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.08)"}`,
    borderRadius: "12px",
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative" as const,
    backdropFilter: "blur(10px)"
  };

  const modalContentStyle = {
    background: isDark ? 'linear-gradient(165deg, rgba(28, 32, 52, 0.98) 0%, rgba(16, 18, 34, 0.99) 100%)' : 'linear-gradient(165deg, #ffffff 0%, #f8f9fb 100%)',
    border: isDark ? '1px solid rgba(180, 195, 220, 0.3)' : '1px solid rgba(99,102,241,0.15)',
    borderRadius: '20px',
    padding: '28px 32px',
    maxWidth: '480px',
    width: '90vw',
    boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.5), 0 8px 32px rgba(120,140,180,0.12)' : '0 24px 80px rgba(99,102,241,0.12), 0 8px 32px rgba(99,102,241,0.06)',
  };

  const quickActionBtnHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)' : 'rgba(99, 102, 241, 0.06)';
    e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const quickActionBtnHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : '#ffffff';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  const segmentCardHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  };

  const segmentCardTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: isDark ? "rgba(255,255,255,0.9)" : "rgba(99,102,241,0.9)",
    lineHeight: 1.4,
  };

  const segmentCardCategoryBadgeStyle: React.CSSProperties = {
    fontSize: "11px",
    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(99,102,241,0.5)",
    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.08)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: 500,
  };

  const segmentCardSummaryStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "12px",
    color: isDark ? "rgba(255,255,255,0.6)" : "rgba(99,102,241,0.6)",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const segmentCardFooterStyle: React.CSSProperties = {
    ...flexCenterJustifyBetween,
    marginTop: "12px",
  };

  const segmentCardDateStyle: React.CSSProperties = {
    fontSize: "10px",
    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(99,102,241,0.4)",
  };

  const segmentCardActionButtonStyle: React.CSSProperties = {
    padding: "4px 8px",
    fontSize: "10px",
    background: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
    color: isDark ? "rgba(99,102,241,0.9)" : "rgba(99,102,241,0.8)",
    border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)"}`,
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const smartSuggestionsBarStyle: React.CSSProperties = {
    position: 'fixed',
    top: '140px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '800px',
    zIndex: 1000,
    backgroundColor: isDark ? 'rgba(28, 32, 52, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(99, 102, 241, 0.12)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(99, 102, 241, 0.1)',
    backdropFilter: 'blur(20px)',
    animation: 'slideDown 0.4s ease-out',
    transition: 'all 0.3s ease'
  };

  const segmentsCarouselContainerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.12)',
    padding: '16px 20px',
    marginBottom: '16px',
    backdropFilter: 'blur(16px)',
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.08)' : '0 4px 24px rgba(99,102,241,0.06)',
  };

  const modalHeaderStyle = {
    ...flexCenterGap14,
    padding: '24px 28px 16px',
    background: isDark ? 'linear-gradient(180deg, rgba(180,200,230,0.08) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 100%)',
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(99,102,241,0.08)'
  };

  const modalFooterStyle = {
    ...flexCenterJustifyBetween,
    padding: '16px 28px',
    borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(99,102,241,0.08)',
    background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(99,102,241,0.02)'
  };

  const floatedOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  };

  const floatedPanelStyle = (maxW = '900px'): React.CSSProperties => ({
    background: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: maxW,
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(99, 102, 241, 0.12)',
    boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(99, 102, 241, 0.12)',
  });

  const floatedHeadingStyle: React.CSSProperties = {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: isDark ? '#fff' : '#111827',
  };

  const floatedCloseButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.08)',
    color: isDark ? '#fff' : '#2f2941',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const slotsGridContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' : 'linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(99,102,241,0.01) 100%)',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(20px)',
    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.08)',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.12)' : '0 8px 32px rgba(99,102,241,0.06)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '800px',
  };

  const slotsGridHeaderStyle: React.CSSProperties = {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(99,102,241,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  };

  const viewModeToggleGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.04)',
    padding: '3px',
    borderRadius: '10px',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.08)',
  };

  const modalBackdropMedium = {
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)'
  };

  return {
    modalOverlayStyle,
    modalBackdropMedium,
    gradientPanelStyle,
    quickActionBtnStyle,
    viewModeButtonStyle,
    toggleButtonStyle,
    segViewModeButtonStyle,
    segmentCardStyle,
    modalContentStyle,
    quickActionBtnHoverIn,
    quickActionBtnHoverOut,
    segmentCardHeaderStyle,
    segmentCardTitleStyle,
    segmentCardCategoryBadgeStyle,
    segmentCardSummaryStyle,
    segmentCardFooterStyle,
    segmentCardDateStyle,
    segmentCardActionButtonStyle,
    smartSuggestionsBarStyle,
    segmentsCarouselContainerStyle,
    modalHeaderStyle,
    modalFooterStyle,
    floatedOverlayStyle,
    floatedPanelStyle,
    floatedHeadingStyle,
    floatedCloseButtonStyle,
    slotsGridContainerStyle,
    slotsGridHeaderStyle,
    viewModeToggleGroupStyle,
  };
}

// ── Local styles factory for FrontendWorkspaceCompact ──
export function createLocalStyles(isDark: boolean) {
  const mutedTextColor = { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(99,102,241,0.45)' };
  const secondaryTextColor = { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(99,102,241,0.55)' };
  const buttonTextColor = { color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(99,102,241,0.55)' };
  const helperTextColor = { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(99,102,241,0.35)' };
  const disabledTextColor = { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(99,102,241,0.4)' };
  const iconButtonColor = { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(99,102,241,0.6)' };

  const circularCloseButtonStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(99,102,241,0.12)',
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)',
    ...iconButtonColor,
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  };

  const badgeStyle = {
    fontSize: '12px',
    ...mutedTextColor,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.06)',
    padding: '3px 10px',
    borderRadius: '999px',
    fontWeight: 600
  };

  const modalTitleStyle = {
    fontSize: '16px',
    fontWeight: 700,
    color: isDark ? '#fff' : '#1e1b2e'
  };

  const quickActionBtnStyle: React.CSSProperties = {
    background: isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99, 102, 241, 0.18)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
  };

  const quickActionBtnHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)' : 'rgba(99, 102, 241, 0.06)';
    e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const quickActionBtnHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : '#ffffff';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.08)',
    borderRadius: '12px',
    padding: '16px'
  };

  const toggleGroupStyle = {
    display: 'flex',
    gap: '4px',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.04)',
    padding: '3px',
    borderRadius: '10px',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.1)'
  };

  const headerTextStyle = {
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    fontSize: '16px',
    fontWeight: '600'
  };

  const subTextStyle = {
    fontSize: '12px',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(99,102,241,0.55)',
    fontWeight: '400'
  };

  const badgePillStyle = {
    fontSize: '11px',
    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(99,102,241,0.45)',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.06)',
    padding: '2px 8px',
    borderRadius: '999px',
    fontWeight: 600
  };

  const closeButtonStyle = {
    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.08)',
    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(99,102,241,0.15)',
    borderRadius: '8px',
    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(99,102,241,0.55)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 8px',
    transition: 'all 0.2s ease',
  };

  const panelBackgroundStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.08)',
  };

  const toggleGroupBackgroundStyle = {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.04)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.08)',
  };

  const buttonBackgroundStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(99,102,241,0.12)',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(99,102,241,0.5)',
  };

  const badgeBackgroundStyle = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.06)',
    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(99,102,241,0.45)',
  };

  const quickActionsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px 14px',
    alignItems: 'center',
  };

  const quickActionsButtonsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  };

  const compareHintStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'rgba(16, 185, 129, 0.9)',
    fontSize: '12px',
    fontWeight: 600,
  };

  const floatingCarouselButtonBaseStyle: React.CSSProperties = {
    borderRadius: '8px',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(99,102,241,0.15)',
    background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    color: isDark ? 'rgba(255,255,255,0.6)' : '#2f2941',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const slotsGridTitleStyle: React.CSSProperties = {
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
    textShadow: isDark ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  };

  const utilityActionsGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.04)',
    borderRadius: '16px',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.1)',
  };

  const selectModeHintStyle: React.CSSProperties = {
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(99,102,241,0.5)',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    fontStyle: 'italic',
  };

  const primaryButtonStyle = {
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
    outline: 'none'
  };

  const secondaryButtonStyle = {
    padding: '6px 14px',
    background: isDark
      ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.06) 100%)'
      : '#ffffff',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    border: isDark ? 'none' : '1px solid rgba(99,102,241,0.18)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    outline: 'none',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
  };

  const disabledSecondaryButtonStyle = {
    ...secondaryButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
    background: isDark
      ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)'
      : 'linear-gradient(135deg, rgba(129,140,248,0.02) 0%, rgba(129,140,248,0.01) 100%)',
    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(129,140,248,0.7)'
  };

  const deepCompareButtonStyle = {
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
  };

  const utilityActionsContainerStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 0',
    borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.08)',
    marginTop: '12px'
  };

  const iconButtonStyle = {
    padding: '5px 10px',
    background: isDark ? 'transparent' : '#ffffff',
    color: isDark ? 'rgba(255,255,255,0.7)' : '#2f2941',
    border: isDark ? 'none' : '1px solid rgba(99,102,241,0.12)',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    justifyContent: 'center',
    outline: 'none',
    boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
  };

  return {
    mutedTextColor,
    secondaryTextColor,
    buttonTextColor,
    helperTextColor,
    disabledTextColor,
    iconButtonColor,
    circularCloseButtonStyle,
    badgeStyle,
    modalTitleStyle,
    quickActionBtnStyle,
    quickActionBtnHoverIn,
    quickActionBtnHoverOut,
    cardStyle,
    toggleGroupStyle,
    headerTextStyle,
    subTextStyle,
    badgePillStyle,
    closeButtonStyle,
    panelBackgroundStyle,
    toggleGroupBackgroundStyle,
    buttonBackgroundStyle,
    badgeBackgroundStyle,
    quickActionsContainerStyle,
    quickActionsButtonsStyle,
    compareHintStyle,
    floatingCarouselButtonBaseStyle,
    slotsGridTitleStyle,
    utilityActionsGroupStyle,
    selectModeHintStyle,
    primaryButtonStyle,
    secondaryButtonStyle,
    disabledSecondaryButtonStyle,
    deepCompareButtonStyle,
    utilityActionsContainerStyle,
    iconButtonStyle,
  };
}
