# Member image submission flow
## Spec for Focal Point — member-facing public site

---

## Overview

The submission flow covers everything a member does
from discovering an open competition to confirming
their entry. It is the most frequently used feature
in the platform and must be fast, clear, and forgiving.

A member can submit an image in two ways:
- Upload a new file directly
- Select from their personal image library

Both paths converge at the same confirmation step.

---

## Entry points

A member can start a submission from three places:

**Competition list page**
A card for each open competition with an
"Enter this competition" button.

**Competition detail page**
The full competition page with a prominent
"Submit an entry" button.

**Member dashboard**
An "Open competitions" section showing competitions
the member is eligible for with entry counts and
deadlines.

All three entry points route to the same submission
flow.

---

## Eligibility checks — before the flow starts

Before the submission flow opens, the system silently
checks eligibility. If any check fails, the member
sees a clear explanation instead of the submission form.

| Check | Fail message |
|---|---|
| Submission window is open | "Submissions for this competition closed on [date]." |
| Member is active | "Your membership must be active to enter competitions." |
| Entry limit not reached | "You've reached the maximum of [X] entries for this competition." |
| Category limit not reached | "You've reached the maximum entries for [category]." |
| Image reuse policy | "This image has already been entered in [competition]. Your club's policy allows [policy description]." |
| Capture date restriction | "This image was captured outside the eligible date range. Images must have been captured within the last [X months/years]." |

Eligibility is checked again server-side on submit.
Client-side checks are for UX only — never trust them
as authoritative.

---

## Submission flow — steps

### Step 1 — Choose a competition and category

If the member arrived from a specific competition
page, this step is pre-filled and skipped.

If arriving from the dashboard or a general entry
point, the member selects:

```
Which competition are you entering?

  ○ Monthly Salon — May 2025
    Open · Submissions close May 15 · You have 2 of 3 entries remaining

  ○ Nature & Wildlife — Spring 2025
    Submissions close May 20 · You have 3 of 3 entries remaining

Which category?   (shown after competition selected)

  ○ Open
  ○ Nature & Wildlife
  ○ Black & White
```

**Single entry per competition:**
Member selects one category. The submission flow
continues with that category fixed.

**Multiple entries allowed (competition setting):**
If the competition allows multiple entries and has
multiple categories, the member selects one category
per submission. Each submission is a separate flow.
The member returns to the competition to submit
additional entries in other categories.

The entry count shown per competition reflects
the total remaining across all categories:
*"You have 2 of 3 entries remaining"*

If a per-category limit also applies, this is
shown when a category is selected:
*"You have 1 of 1 entries remaining in this category"*

If the competition has only one category, the
category selection is skipped entirely.

Entry count remaining shown per competition so
the member knows their allowance before selecting.

---

### Step 2 — Choose your image

Two tabs: Upload new · From my library

---

#### Tab A — Upload new

```
Upload your image

[  Drag and drop your image here  ]
[  or click to browse             ]

JPEG · Max 5MB · Long edge max 1920px
sRGB colour space recommended
```

Standard drag-and-drop upload zone. Click to open
file picker. Accepts JPEG only.

**On file selection:**
- Show a preview of the image immediately
- Run client-side validation:
  - File type (JPEG only)
  - File size (max 5MB)
  - Long edge (max configured value)
- Show inline errors if validation fails:

```
⚠ This file is 7.2MB. Maximum file size is 5MB.
  Please export a smaller version and try again.

⚠ This image's long edge is 3200px. Maximum is 1920px.
  Please resize and try again.
```

- Read EXIF data client-side on upload:
  - Check capture date against restriction if enabled
  - Check for prior submission of this image
    (by comparing EXIF unique identifiers if available)
  - Store EXIF data against the submission record

**EXIF capture date check:**
If competition has a capture date restriction and
EXIF date is outside the eligible range:

```
⚠ This image was captured on Jan 3 2022, which is
  outside the eligible date range.
  Images must have been captured within the last 2 years.

  If this is incorrect, your camera clock may need
  updating. Contact the club admin if you believe
  this is an error.
```

**No EXIF date found:**
```
ℹ  No capture date found in this image's metadata.
   This entry will be flagged for manual review.
   You can still submit — a club admin will follow up
   if needed.
```

**Image preview after successful upload:**
Show the image at a reasonable preview size with
file name, dimensions, and file size confirmed:

```
[Image preview]

filename.jpg  ·  1920 × 1280px  ·  3.4MB  ·  ✓

[ Choose a different image ]
```

---

#### Tab B — From my library

Member's previously uploaded images shown in a
scrollable grid. Each image shows title (if set),
upload date, and whether it has been entered in
a previous competition.

```
My image library

Filter: [All] [Not yet entered] [Previously entered]

[Image grid — 3 columns]

Each card:
  [Thumbnail]
  Title or filename
  Uploaded Jan 12
  [Entered in Monthly Salon Feb ·  reuse policy applies]
```

Clicking an image selects it. Selected state shown
with a blue border and checkmark.

**Reuse policy enforcement:**
If the image has been entered before and the
competition's reuse policy prevents re-entry,
the card is shown in a disabled/muted state with
an explanation on hover or tap:

```
[Muted card]
⚠ Already entered in Monthly Salon — Feb 2025.
  Your club's policy: once per competition type.
  This image cannot be re-entered in another
  monthly salon.
```

Images that are eligible show normally and are
selectable.

**Empty library state:**
```
Your image library is empty.
Images you upload to competitions are saved here
for future use.

[ Upload a new image instead ]
```

---

### Step 3 — Image details

Shown after an image is selected or uploaded.

```
Image details

Title                          required
[ _________________________________ ]
Shown in results and on your profile.

Notes to the judge             optional
[ _________________________________ ]
Any context you'd like the judge to consider.
Not shown publicly.

(Notes field only shown if competition allows it —
configurable per competition.)
```

**Title behaviour:**
- Required — member cannot submit without a title
- Submit button disabled until title is entered
- Title is shown publicly in results and on
  the member's profile competition history
- Inline error if submit attempted without title:
  *"Please give your image a title before submitting."*

**Notes to judge:**
- Optional, never required
- Visible to the judge during scoring
- Never shown to other members or publicly
- Hidden entirely if competition has notes disabled

---

### Step 4 — Review and confirm

Summary of the entry before submitting.

```
Review your entry

Competition    Monthly Salon — May 2025
Category       Open

[Image preview — medium size]

Title          Golden hour, Plum Island     (required — shown in results)
File           IMG_4521.jpg · 1920 × 1280px · 3.4MB
Captured       Apr 28 2025  (from EXIF)

[ Edit details ]    [ Change image ]

By submitting you confirm this is your own
original work and has not been submitted to
another competition in violation of your
club's image reuse policy.

[ Submit entry ]
```

"Edit details" returns to step 3.
"Change image" returns to step 2.
Submit is a single clear primary button.

---

### Step 5 — Confirmation

```
Entry submitted

Your image has been entered into
Monthly Salon — May 2025 — Open category.

[Image preview — small]

Golden hour, Plum Island
Entry #12 of 34

You have 2 entries remaining for this competition.

[ Submit another entry ]    [ View my entries ]
[ Back to competitions ]
```

**"Submit another entry"** — restarts the flow
pre-filled with the same competition. Useful when
a member has multiple entries allowed.

**"View my entries"** — takes member to their
entries page for this competition.

**"Back to competitions"** — returns to competition
list.

---

## Withdrawal flow

If the competition allows withdrawals after close,
a member can withdraw from their entries page.

**Withdrawal confirmation:**

```
Withdraw this entry?

"Golden hour, Plum Island"
Monthly Salon — May 2025 — Open

Withdrawing this entry will remove it from
the competition. This cannot be undone.

Note: Your entry slot will not be returned —
[OR]
Note: Your entry slot will be returned and
you can submit a different image.

(Copy depends on club's withdrawal slot policy)

[ Cancel ]    [ Withdraw entry ]
```

After withdrawal:
- Entry is removed from the competition
- Image remains in the member's library
- Image reuse restriction is cleared if applicable
  (image can be re-entered elsewhere)

---

## Duplicate image detection

Two-layer check runs on every submission to catch
re-entry of the same image. Neither layer is a
hard block on its own — together they create
meaningful friction without punishing false positives.

---

### Layer 1 — EXIF ImageUniqueID (client-side)

Runs immediately on file select, before upload begins.

Most DSLRs, mirrorless cameras, and iPhones write
a unique identifier into EXIF at capture time
(`ImageUniqueID` field). This is read client-side
and compared against the member's existing library.

**If an exact EXIF match is found:**
```
This image may have been submitted before.

[Thumbnail of matched image]
Golden hour, Plum Island
Submitted — Monthly Salon Feb 2025 · Open

Is this the same image? Your club's reuse policy
may apply.

[ Yes, use this image anyway ]
[ Choose a different image   ]
```

The member can proceed — this is a warning, not
a block. Choosing "Yes, use this image anyway"
flags the entry for admin awareness and applies
the reuse policy check normally.

**If no EXIF unique ID is present:**
No warning shown — proceed silently to Layer 2.
Absence of EXIF is common and not suspicious.

---

### Layer 2 — Perceptual hash (server-side)

Runs after upload, before the member reaches
the review step. Computes a perceptual hash
(pHash) of the uploaded image and compares it
against all images in the member's library.

A perceptual hash fingerprints the actual pixel
content of the image — not the metadata. Two
versions of the same image (resized, lightly
cropped, re-exported with EXIF stripped) will
produce similar hash values.

**If a close match is found (similarity above threshold):**
```
This image looks similar to one you've previously
submitted.

[Thumbnail of matched image]
Golden hour, Plum Island
Submitted — Monthly Salon Feb 2025 · Open

If this is the same image, your club's reuse
policy may apply.

[ It's a different image — continue ]
[ View my submission history         ]
```

"It's a different image — continue" allows the
member to proceed. This override is recorded
against the submission for admin visibility.

False positives are possible — two photos of
the same scene taken seconds apart will hash
similarly. The warning must be overridable.

**Similarity threshold:**
A pHash similarity of 90% or above triggers
the warning. This catches re-exports, minor
crops, and resize operations while avoiding
false positives from similar-subject photos.
The threshold is configurable in system settings.

**If no match found:**
Proceed silently. No message shown.

---

### Data model additions

```typescript
interface LibraryImage {
  // existing fields ...
  exifUniqueId?: string     // ImageUniqueID from EXIF
                            // undefined if not present in file
  pHash?: string            // perceptual hash computed server-side
                            // undefined until processing completes
  pHashStatus: 'pending'    // upload received, hash not yet computed
              | 'complete'  // hash computed and stored
              | 'failed'    // hash computation failed — skip check
}

interface CompetitionEntry {
  // existing fields ...
  duplicateWarningShown: boolean    // true if either layer flagged
  duplicateWarningOverridden: boolean  // true if member chose to proceed
}
```

---

### Limitations

EXIF can be stripped or altered — by export
settings, editing software, or social media
processing. Perceptual hashing is more robust
but not infallible against heavy edits.

The combination of both layers plus the original
work declaration at the review step creates
enough friction to catch accidental duplicates
and make intentional re-entry a conscious act.
This is the appropriate bar for a camera club
environment.

Admin can see `duplicateWarningOverridden` on
any entry — useful context when reviewing
borderline reuse policy cases.

Regardless of whether the member uploaded a new
image or selected from their library, the image
record in the library updates immediately on
successful submission.

**Before submission:**
```
[Thumbnail]
Golden hour, Plum Island
Uploaded Apr 28 2025
Not yet entered
```

**After submission:**
```
[Thumbnail]
Golden hour, Plum Island
Uploaded Apr 28 2025
Submitted — Monthly Salon May 2025 · Open
```

**If submitted to multiple competitions over time:**
```
[Thumbnail]
Golden hour, Plum Island
Uploaded Apr 28 2025
Submitted — Monthly Salon May 2025 · Open
Submitted — Annual Showcase 2025
```

Each submission appended as a separate line.
Most recent submission shown first.

**After withdrawal:**
```
[Thumbnail]
Golden hour, Plum Island
Uploaded Apr 28 2025
Withdrawn — Monthly Salon May 2025 · Open
```

Withdrawn status replaces the submitted line
for that competition. Does not remove the image
from the library.

**Upload path behaviour:**
When a member uploads a new image and submits it,
the image is saved to the library at the same
moment as the submission — not before. If the
member uploads an image but abandons the flow
before submitting, the image is not saved to
the library.

**Library path behaviour:**
When a member selects an existing library image
and submits it, the existing library record is
updated with the new submission entry. The image
is not duplicated in the library.

**Library metadata stored per image:**

```typescript
interface LibraryImage {
  id: string
  memberId: string
  filename: string
  title?: string
  fileSize: number
  dimensions: {
    width: number
    height: number
  }
  uploadedAt: Date
  exif?: {
    capturedAt?: Date
    cameraMake?: string
    cameraModel?: string
    lens?: string
    focalLength?: string
    aperture?: string
    shutterSpeed?: string
    iso?: number
  }
  competitionHistory: CompetitionEntry[]
}

interface CompetitionEntry {
  competitionId: string
  competitionName: string
  categoryId: string
  categoryName: string
  enteredAt: Date
  withdrawn: boolean
  withdrawnAt?: Date
}
```

---

## Validation rules — full reference

All rules enforced client-side for UX and
server-side for integrity.

| Rule | Source | Enforcement |
|---|---|---|
| JPEG only | Club Defaults | Block on file select |
| Max file size | Club Defaults | Block on file select |
| Max long edge | Competition setting | Block on file select |
| sRGB colour space | Informational only | Warning, not block |
| Capture date restriction | Competition setting | Block on submit |
| Max entries per member | Competition setting | Block before flow starts |
| Max entries per category | Competition setting | Block before flow starts |
| Image reuse policy | Competition setting | Block or warn depending on policy |
| Image title | Required | Block on submit if empty |
| Original work agreement | Implicit on submit | Shown in review step |
| Member must be active | System | Block before flow starts |
| Submission window open | System | Block before flow starts |

---

## sRGB colour space

sRGB is the required colour space for projected
competitions. The system reads colour space from
EXIF/ICC profile on upload and shows a warning
(not a block) if the image is not sRGB:

```
ℹ  This image appears to use Adobe RGB colour space.
   Images are displayed in sRGB for this competition.
   Colours may appear less saturated than expected.
   Consider exporting in sRGB for best results.
```

This is informational — the member can still submit.

---

## Error states

**Upload fails (network error):**
```
Upload failed. Please check your connection
and try again.
[ Try again ]
```

**Submit fails (server error):**
```
Something went wrong. Your entry was not submitted.
Please try again — your image has been saved.
[ Try again ]
```

**Session expired during flow:**
```
Your session has expired. Please sign in again
to complete your submission.
[ Sign in ]
```

---

## Responsive behaviour

| Breakpoint | Layout |
|---|---|
| Mobile < 640px | Single column, full-width upload zone, library in 2-col grid |
| Tablet 640–1024px | Single column, larger preview |
| Desktop > 1024px | Centered max-width 680px — form never goes wide |

The submission flow is intentionally narrow — it is
a focused task, not a dashboard. Max width 680px
on all breakpoints above mobile.

---

## Related specs

- club-defaults-spec.md — image requirements and
  submission rules that feed into validation
- competition-creation-flow-v4.md — per-competition
  overrides for entry limits, long edge, reuse policy
- competition-detail-page-spec.md — competition
  context shown in submission flow
- judging-portal-spec.md — EXIF data stored at
  submission is read by judge portal if permitted
