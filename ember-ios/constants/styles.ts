import { StyleSheet } from 'react-native';

// ─── Palette ─────────────────────────────────────────────────────────────────

export const Palette = {
  // Brand
  primary: '#8537f3',
  primaryLight: '#eff6ff',

  // Semantic
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  success: '#22c55e',
  successLight: '#f0fdf4',

  // Neutrals
  white: '#fff',
  black: '#000',
  text: '#111',
  textSecondary: '#888',
  textMuted: '#aaa',
  textSubtle: '#666',
  textFaint: '#999',
  border: '#e5e5e5',
  borderMuted: '#ccc',
  background: '#fff',
  backgroundMuted: '#f9f9f9',

  // Shadows
  shadow: '#000',
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const Radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 9999,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 15,
  lg: 16,
  xl: 17,
  xxl: 20,
  xxxl: 22,
  display: 28,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadow = {
  sm: {
    shadowColor: Palette.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: Palette.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

// ─── Global Styles ────────────────────────────────────────────────────────────

export const globalStyles = StyleSheet.create({

  // ── Layout ──────────────────────────────────────────────────────────────────
  flex1: { flex: 1 },
  safe: { flex: 1, backgroundColor: Palette.background },
  screenCenter: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },

  // ── Typography ───────────────────────────────────────────────────────────────
  pageTitle: { fontSize: FontSize.display, fontWeight: FontWeight.bold, marginBottom: Spacing.xl },
  heading: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Palette.text },
  subheading: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Palette.text },
  subtitle: { fontSize: FontSize.sm, color: Palette.textSubtle, marginBottom: Spacing.xl },
  bodyText: { fontSize: FontSize.md, color: Palette.text },
  mutedText: { fontSize: FontSize.md, color: Palette.textMuted },
  linkText: { color: Palette.primary, fontSize: FontSize.md },
  centeredLink: { textAlign: 'center', color: Palette.primary, marginTop: Spacing.lg },

  // ── Form ─────────────────────────────────────────────────────────────────────
  formScroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xxl },
  field: { marginBottom: Spacing.xl },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm + 2,
  },
  formLabel: { fontSize: FontSize.sm, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.lg,
    padding: Spacing.md + 2,
    fontSize: FontSize.md,
    color: Palette.text,
  },
  inputError: { borderColor: Palette.danger },
  errorText: { fontSize: FontSize.xs, color: Palette.danger, marginTop: Spacing.xs },
  textarea: { height: 90, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateBtn: { flex: 1, justifyContent: 'center' },
  dateText: { fontSize: FontSize.sm, color: '#333' },

  // ── Chips ─────────────────────────────────────────────────────────────────────
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  chipText: { fontSize: FontSize.sm, color: Palette.textSecondary },
  chipTextActive: { color: Palette.primary, fontWeight: FontWeight.semibold },

  // ── Buttons ──────────────────────────────────────────────────────────────────
  btn: { backgroundColor: Palette.primary, borderRadius: Radii.xl, padding: Spacing.lg + 2, alignItems: 'center' },
  btnText: { color: Palette.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  btnDanger: { backgroundColor: Palette.danger, borderRadius: Radii.xl, padding: Spacing.lg + 2, alignItems: 'center' },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.sm,
  },

  // ── Task Card ────────────────────────────────────────────────────────────────
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  taskTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Palette.text, flex: 1, marginRight: Spacing.sm },
  priorityBadge: { borderRadius: Radii.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  priorityText: { fontSize: 11, fontWeight: FontWeight.bold, color: Palette.white },
  cardDescription: { fontSize: 13, color: Palette.textSubtle, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { fontSize: FontSize.xs, color: Palette.textFaint },
  strikethrough: { textDecorationLine: 'line-through', color: Palette.textMuted },

  // ── Swipe Actions ────────────────────────────────────────────────────────────
  swipeActions: { flexDirection: 'row', alignItems: 'stretch', marginBottom: Spacing.md, marginLeft: Spacing.sm, gap: Spacing.sm },
  swipeActionBtn: { justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: Radii.xl },
  swipeEdit: { backgroundColor: Palette.primary },
  swipeDelete: { backgroundColor: Palette.danger },
  actionText: { color: Palette.white, fontWeight: FontWeight.bold, fontSize: 13 },

  // ── Home Header ──────────────────────────────────────────────────────────────
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  calendarButton: { padding: Spacing.xs },
  headerDate: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Palette.text },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { color: Palette.textMuted, fontSize: FontSize.md },

  // ── Calendar ─────────────────────────────────────────────────────────────────
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  calendarBackBtn: { padding: 6 },
  calendarHeaderTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Palette.text },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Palette.text },
  dayLabelsRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarWeek: { flexDirection: 'row' },
  calendarCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.lg, margin: 2 },
  calendarCellToday: { backgroundColor: Palette.primary },
  calendarCellText: { fontSize: FontSize.sm, color: Palette.text, fontWeight: FontWeight.medium },
  calendarCellTextToday: { color: Palette.white, fontWeight: FontWeight.bold },

  // ── Settings ─────────────────────────────────────────────────────────────────
  settingsHeaderImage: { color: Palette.textSecondary, bottom: -90, left: -35, position: 'absolute' },
  settingsTitleContainer: { flexDirection: 'row', gap: Spacing.sm },
});
