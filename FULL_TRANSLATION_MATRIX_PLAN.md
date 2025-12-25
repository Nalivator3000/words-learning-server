# Full Translation Matrix Plan

## Goal: Complete Translation Coverage for Core 16 Languages

**Target:** Create translation pairs for 16 core learning languages (excluding Swahili & Serbian as sources)
**Formula:** 16 source languages × 17 target languages = 272 total pairs
**Note:** Swahili and Serbian remain as target languages but won't be used as source languages

---

## Current Status

**Completed:** 57/272 pairs (21.0%)
**Remaining:** 215 pairs
**Total translations in DB:** 541,614

### Core Learning Languages (16 Source + 2 Target-Only)

**16 Source Languages** (will translate FROM these):

| Code | Language    | Flag | Word Count | Current Source Coverage |
|------|-------------|------|------------|------------------------|
| de   | German      | 🇩🇪   | 8,076      | ✅ 13/17 (76.5%)      |
| en   | English     | 🇬🇧   | 9,974      | ✅ 13/17 (76.5%)      |
| es   | Spanish     | 🇪🇸   | 9,972      | ✅ 13/17 (76.5%)      |
| ru   | Russian     | 🇷🇺   | ~10,000    | ❌ 0/17 (0%)          |
| fr   | French      | 🇫🇷   | 9,332      | ⚠️ 4/17 (23.5%)       |
| it   | Italian     | 🇮🇹   | 10,000     | ⚠️ 4/17 (23.5%)       |
| pt   | Portuguese  | 🇵🇹   | 10,000     | ⚠️ 4/17 (23.5%)       |
| ar   | Arabic      | 🇸🇦   | 10,000     | ⚠️ 2/17 (11.8%)       |
| zh   | Chinese     | 🇨🇳   | 10,000     | ⚠️ 4/17 (23.5%)       |
| ja   | Japanese    | 🇯🇵   | ~10,000    | ❌ 0/17 (0%)          |
| ko   | Korean      | 🇰🇷   | ~10,000    | ❌ 0/17 (0%)          |
| pl   | Polish      | 🇵🇱   | ~10,000    | ❌ 0/17 (0%)          |
| ro   | Romanian    | 🇷🇴   | ~10,000    | ❌ 0/17 (0%)          |
| uk   | Ukrainian   | 🇺🇦   | ~10,000    | ❌ 0/17 (0%)          |
| tr   | Turkish     | 🇹🇷   | ~10,000    | ❌ 0/17 (0%)          |
| hi   | Hindi       | 🇮🇳   | ~10,000    | ❌ 0/17 (0%)          |

**2 Target-Only Languages** (won't be used as source):

| Code | Language    | Flag | Status |
|------|-------------|------|--------|
| sr   | Serbian     | 🇷🇸   | 🎯 Target only (used in existing translations) |
| sw   | Swahili     | 🇰🇪   | 🎯 Target only (used in existing translations) |

---

## Phase-by-Phase Implementation Plan

### Phase 1: Complete "Big 3" Languages (Priority: HIGH)
**Goal:** Get German, English, Spanish to 100% coverage (17/17 each)

#### German → Missing (4 pairs, ~32,000 words)
- [ ] de → ja (Japanese)
- [ ] de → ko (Korean)
- [ ] de → hi (Hindi)
- [ ] de → tr (Turkish)

#### English → Missing (4 pairs, ~40,000 words)
- [ ] en → ja (Japanese)
- [ ] en → ko (Korean)
- [ ] en → hi (Hindi)
- [ ] en → tr (Turkish)

#### Spanish → Missing (4 pairs, ~40,000 words)
- [ ] es → ja (Japanese)
- [ ] es → ko (Korean)
- [ ] es → hi (Hindi)
- [ ] es → tr (Turkish)

**Phase 1 Total:** 12 pairs, ~120,000 translations

---

### Phase 2: Expand European Languages (Priority: MEDIUM-HIGH)

#### French → Missing (13 pairs, ~121,000 words)
- [ ] fr → ar (Arabic)
- [ ] fr → it (Italian)
- [ ] fr → pt (Portuguese)
- [ ] fr → pl (Polish)
- [ ] fr → ro (Romanian)
- [ ] fr → sr (Serbian)
- [ ] fr → uk (Ukrainian)
- [ ] fr → tr (Turkish)
- [ ] fr → sw (Swahili)
- [ ] fr → zh (Chinese)
- [ ] fr → ja (Japanese)
- [ ] fr → ko (Korean)
- [ ] fr → hi (Hindi)

#### Italian → Missing (13 pairs, ~130,000 words)
- [ ] it → ar (Arabic)
- [ ] it → fr (French)
- [ ] it → pt (Portuguese)
- [ ] it → pl (Polish)
- [ ] it → ro (Romanian)
- [ ] it → sr (Serbian)
- [ ] it → uk (Ukrainian)
- [ ] it → tr (Turkish)
- [ ] it → sw (Swahili)
- [ ] it → zh (Chinese)
- [ ] it → ja (Japanese)
- [ ] it → ko (Korean)
- [ ] it → hi (Hindi)

#### Portuguese → Missing (13 pairs, ~130,000 words)
- [ ] pt → ar (Arabic)
- [ ] pt → fr (French)
- [ ] pt → it (Italian)
- [ ] pt → pl (Polish)
- [ ] pt → ro (Romanian)
- [ ] pt → sr (Serbian)
- [ ] pt → uk (Ukrainian)
- [ ] pt → tr (Turkish)
- [ ] pt → sw (Swahili)
- [ ] pt → zh (Chinese)
- [ ] pt → ja (Japanese)
- [ ] pt → ko (Korean)
- [ ] pt → hi (Hindi)

**Phase 2 Total:** 39 pairs, ~381,000 translations

---

### Phase 3: Expand Arabic & Chinese (Priority: MEDIUM)

#### Arabic → Missing (15 pairs, ~150,000 words)
- [ ] ar → de (German)
- [ ] ar → es (Spanish)
- [ ] ar → fr (French)
- [ ] ar → it (Italian)
- [ ] ar → pt (Portuguese)
- [ ] ar → pl (Polish)
- [ ] ar → ro (Romanian)
- [ ] ar → sr (Serbian)
- [ ] ar → uk (Ukrainian)
- [ ] ar → tr (Turkish)
- [ ] ar → sw (Swahili)
- [ ] ar → zh (Chinese)
- [ ] ar → ja (Japanese)
- [ ] ar → ko (Korean)
- [ ] ar → hi (Hindi)

#### Chinese → Missing (13 pairs, ~130,000 words)
- [ ] zh → ar (Arabic)
- [ ] zh → fr (French)
- [ ] zh → it (Italian)
- [ ] zh → pt (Portuguese)
- [ ] zh → pl (Polish)
- [ ] zh → ro (Romanian)
- [ ] zh → sr (Serbian)
- [ ] zh → uk (Ukrainian)
- [ ] zh → tr (Turkish)
- [ ] zh → sw (Swahili)
- [ ] zh → ja (Japanese)
- [ ] zh → ko (Korean)
- [ ] zh → hi (Hindi)

**Phase 3 Total:** 28 pairs, ~280,000 translations

---

### Phase 4: Add Russian as Source (Priority: MEDIUM)

#### Russian → All (17 pairs, ~170,000 words)
- [ ] ru → de (German)
- [ ] ru → en (English)
- [ ] ru → es (Spanish)
- [ ] ru → fr (French)
- [ ] ru → it (Italian)
- [ ] ru → pt (Portuguese)
- [ ] ru → ar (Arabic)
- [ ] ru → zh (Chinese)
- [ ] ru → ja (Japanese)
- [ ] ru → ko (Korean)
- [ ] ru → pl (Polish)
- [ ] ru → ro (Romanian)
- [ ] ru → sr (Serbian)
- [ ] ru → uk (Ukrainian)
- [ ] ru → tr (Turkish)
- [ ] ru → sw (Swahili)
- [ ] ru → hi (Hindi)

**Phase 4 Total:** 17 pairs, ~170,000 translations

---

### Phase 5: Add Eastern European Languages (Priority: LOW-MEDIUM)

#### Polish → All (17 pairs, ~170,000 words)
- [ ] pl → de, en, es, fr, it, pt, ar, zh, ja, ko, ru, ro, sr, uk, tr, sw, hi

#### Romanian → All (17 pairs, ~170,000 words)
- [ ] ro → de, en, es, fr, it, pt, ar, zh, ja, ko, ru, pl, sr, uk, tr, sw, hi

#### Ukrainian → All (17 pairs, ~170,000 words)
- [ ] uk → de, en, es, fr, it, pt, ar, zh, ja, ko, ru, pl, ro, sr, tr, sw, hi

**Phase 5 Total:** 51 pairs, ~510,000 translations

---

### Phase 6: Add Asian Languages (Priority: LOW)

#### Japanese → All (17 pairs, ~170,000 words)
- [ ] ja → de, en, es, fr, it, pt, ar, zh, ko, ru, pl, ro, sr, uk, tr, sw, hi

#### Korean → All (17 pairs, ~170,000 words)
- [ ] ko → de, en, es, fr, it, pt, ar, zh, ja, ru, pl, ro, sr, uk, tr, sw, hi

#### Hindi → All (17 pairs, ~170,000 words)
- [ ] hi → de, en, es, fr, it, pt, ar, zh, ja, ko, ru, pl, ro, sr, uk, tr, sw

**Phase 6 Total:** 51 pairs, ~510,000 translations

---

### Phase 7: Add Turkish (Priority: LOW)

#### Turkish → All (17 pairs, ~170,000 words)
- [ ] tr → de, en, es, fr, it, pt, ar, zh, ja, ko, ru, pl, ro, sr, uk, sw, hi

**Phase 7 Total:** 17 pairs, ~170,000 translations

---

## Grand Total Summary

| Phase | Focus | Pairs | Est. Translations | Priority | Status |
|-------|-------|-------|------------------|----------|--------|
| **Current** | - | 57 | 541,614 | - | ✅ Done |
| **Phase 1** | Complete Big 3 (de, en, es) | 12 | ~120,000 | 🔴 HIGH | ⏳ Planned |
| **Phase 2** | European (fr, it, pt) | 39 | ~381,000 | 🟠 MED-HIGH | ⏳ Planned |
| **Phase 3** | Arabic & Chinese | 28 | ~280,000 | 🟡 MEDIUM | ⏳ Planned |
| **Phase 4** | Russian | 17 | ~170,000 | 🟡 MEDIUM | ⏳ Planned |
| **Phase 5** | East European (pl, ro, uk) | 51 | ~510,000 | 🟢 LOW-MED | ⏳ Planned |
| **Phase 6** | Asian (ja, ko, hi) | 51 | ~510,000 | 🔵 LOW | ⏳ Planned |
| **Phase 7** | Turkish | 17 | ~170,000 | 🔵 LOW | ⏳ Planned |
| **TOTAL** | **Full Matrix (16 sources)** | **272** | **~2,800,000** | - | 21.0% |

---

## Implementation Strategy

### Batch Processing Approach

**Daily quota:** ~20-30 pairs per day (safe rate for Google Translate API)
**Estimated timeline:** 10-15 days to complete all phases

### Script to Use

Create: `scripts/translations/translate-matrix.js`

```javascript
// Phases in priority order
const TRANSLATION_PHASES = [
    {
        name: 'Phase 1: Complete Big 3',
        priority: 1,
        pairs: [
            { source: 'de', target: 'ja' },
            { source: 'de', target: 'ko' },
            { source: 'de', target: 'hi' },
            { source: 'en', target: 'ja' },
            { source: 'en', target: 'ko' },
            { source: 'en', target: 'hi' },
            { source: 'es', target: 'ja' },
            { source: 'es', target: 'ko' },
            { source: 'es', target: 'hi' }
        ]
    },
    // ... more phases
];
```

### Rate Limiting

- **Batch size:** 100 words per request
- **Delay between requests:** 100-200ms
- **Pairs per run:** 5-10 (to avoid API limits)
- **Run frequency:** Once per day or every few hours

### Monitoring

Track progress with:
```bash
node scripts/utils/check-all-translations.js
```

---

## Prerequisites

### 1. Check Source Vocabularies Exist

Before starting each phase, verify that source vocabulary exists:

```sql
SELECT language_code, COUNT(*)
FROM vocabularies v
JOIN words w ON w.vocabulary_id = v.id
WHERE language_code IN ('ja', 'ko', 'hi', 'ru')
GROUP BY language_code;
```

### 2. Create Missing Source Vocabularies

If needed, import missing vocabularies:
- Japanese: Frequency list (JLPT N5-N1)
- Korean: Frequency list (TOPIK)
- Hindi: Frequency list (Common words)
- Russian: Already exists as target, need as source

### 3. Database Preparation

Ensure adequate storage:
- Current: ~542K translations
- Target: ~3.45M translations (6x increase)
- Estimated DB size increase: ~500MB → ~3GB

---

## Risk Mitigation

### API Rate Limits
- Use free Google Translate API endpoint
- Implement exponential backoff
- Save progress every 100 translations
- Resume capability if interrupted

### Data Quality
- Spot-check translations manually
- Compare with existing pairs for consistency
- Flag low-confidence translations

### Performance
- Create indexes on translation tables after population
- Run VACUUM ANALYZE after large imports
- Monitor Railway database metrics

---

## Success Metrics

- [ ] All 306 pairs created
- [ ] All pairs have >90% coverage (relative to source vocabulary size)
- [ ] Translation quality spot-check: >95% acceptable
- [ ] Database performance maintained (<100ms query time)
- [ ] API costs: $0 (using free tier)

---

## Next Steps (Immediate)

1. **Verify vocabularies exist** for Phase 1 target languages (ja, ko, hi)
2. ✅ **Master translation scripts created** - See `scripts/translations/`
3. **Start automatic translation** - Choose one option:

### Option A: Fully Automatic (Recommended)
```bash
cd scripts/translations
node auto-translate-cron.js 6
```
Runs every 6 hours until all 215 pairs complete (~10-15 days)

### Option B: Windows Easy Mode
```bash
cd scripts/translations
start-auto-translate.bat
```
Choose Option 2 (Background) for hands-off operation

### Option C: Manual Control
```bash
cd scripts/translations
node translate-matrix-parallel.js
```
Run manually when you want, progress auto-saves

---

## Created Scripts

All scripts are ready in `scripts/translations/`:

| Script | Purpose | Usage |
|--------|---------|-------|
| `translate-matrix-parallel.js` | Main worker (3 pairs in parallel) | `node translate-matrix-parallel.js` |
| `auto-translate-cron.js` | Auto-scheduler (runs every N hours) | `node auto-translate-cron.js 6` |
| `start-auto-translate.bat` | Windows GUI launcher | Double-click |
| `translate-pair-v2.js` | Single pair translator | `node translate-pair-v2.js de ja` |
| `README.md` | Full documentation | Read for details |

**Progress tracking:** `.translation-progress.json` (auto-created)
**Check status:** `node scripts/utils/check-all-translations.js`

---

**Created:** 2025-12-25
**Last Updated:** 2025-12-25
**Status:** ✅ Scripts Ready - Ready to Execute
