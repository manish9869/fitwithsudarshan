// src/pages/admin/diet/dietPdfGenerator.js
//
// Diet plan PDF export — deliberately built with plain jsPDF primitives
// (rect/text/line), the same technique already used by
// ../adminUtils.js's exportEnrollmentsToPDF/exportAssessmentsToPDF, instead
// of pulling in jspdf-autotable as a new dependency. `drawTable()` below is
// a small reusable, page-break-aware version of that same hand-drawn-table
// technique, generalized so it can be reused across day tables.
//
// Unlike those two reports (internal, dark-themed, single page), this PDF
// is a client-facing deliverable meant to be printed/read daily — so it
// uses a white page background with black/pink header-footer bars, not the
// dark admin theme.
import jsPDF from 'jspdf';

const PW = 210, PH = 297; // A4 portrait, mm
const ML = 14, MR = 14;
const CW = PW - ML - MR;
const CONTENT_TOP = 36;
const FOOTER_H = 14;

const BRAND_PINK = [231, 23, 99];
const BRAND_BLACK = [10, 10, 10];
const DARK_GRAY = [30, 30, 30];
const MID_GRAY = [110, 110, 110];
const LIGHT_GRAY = [210, 210, 210];
const WHITE = [255, 255, 255];
const ROW_TEXT = [40, 40, 40];
const ALT_ROW = [248, 244, 247];
const TOTAL_ROW_BG = [252, 234, 242];
const TOTAL_ROW_TEXT = [180, 10, 90];

function calcDayTotals(day) {
    let calories = 0, protein = 0, carbs = 0, fats = 0, caloriesBurned = 0;
    (day.meals || []).forEach((m) => (m.foods || []).forEach((f) => {
        calories += f.calories * f.quantity;
        protein += f.protein * f.quantity;
        carbs += f.carbs * f.quantity;
        fats += f.fats * f.quantity;
    }));
    (day.exercises || []).forEach((e) => { caloriesBurned += e.caloriesBurned; });
    return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fats: Math.round(fats), caloriesBurned: Math.round(caloriesBurned) };
}

function ensureSpace(doc, y, needed) {
    if (y + needed > PH - FOOTER_H - 6) {
        doc.addPage();
        return CONTENT_TOP;
    }
    return y;
}

// Hand-drawn table — header row + striped body rows + bottom borders,
// paginating (with the header re-drawn) whenever a row would overflow.
function drawTable(doc, { startY, columns, rows }) {
    let y = startY;
    const headerH = 8, rowH = 7;

    const drawHeader = () => {
        doc.setFillColor(...BRAND_BLACK);
        doc.rect(ML, y, CW, headerH, 'F');
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        let cx = ML + 2;
        columns.forEach((col) => {
            doc.text(col.label, col.align === 'right' ? cx + col.w - 2 : cx, y + headerH - 2.6, col.align === 'right' ? { align: 'right' } : undefined);
            cx += col.w;
        });
        y += headerH;
    };

    drawHeader();

    rows.forEach((row, i) => {
        if (y + rowH > PH - FOOTER_H - 6) {
            doc.addPage();
            y = CONTENT_TOP;
            drawHeader();
        }
        const isTotal = !!row.isTotal;
        if (isTotal) { doc.setFillColor(...TOTAL_ROW_BG); doc.rect(ML, y, CW, rowH, 'F'); }
        else if (i % 2 === 1) { doc.setFillColor(...ALT_ROW); doc.rect(ML, y, CW, rowH, 'F'); }

        doc.setFont('helvetica', isTotal || row.bold ? 'bold' : 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...(isTotal ? TOTAL_ROW_TEXT : ROW_TEXT));
        let cx = ML + 2;
        columns.forEach((col, ci) => {
            const val = String(row.cells[ci] ?? '');
            doc.text(val, col.align === 'right' ? cx + col.w - 2 : cx, y + rowH - 2.4, col.align === 'right' ? { align: 'right' } : undefined);
            cx += col.w;
        });

        doc.setDrawColor(...LIGHT_GRAY);
        doc.setLineWidth(0.1);
        doc.line(ML, y + rowH, ML + CW, y + rowH);
        y += rowH;
    });

    return y;
}

function dayBanner(doc, y, label, tot, includeExercise) {
    doc.setFillColor(...DARK_GRAY);
    doc.roundedRect(ML, y, CW, 10, 2, 2, 'F');
    doc.setFillColor(...BRAND_PINK);
    doc.roundedRect(ML, y, 4, 10, 1, 1, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label, ML + 8, y + 6.8);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LIGHT_GRAY);
    const summary = `${tot.calories} kcal | P: ${tot.protein}g | C: ${tot.carbs}g | F: ${tot.fats}g${includeExercise ? ` | Burn: ~${tot.caloriesBurned} kcal` : ''}`;
    doc.text(summary, ML + CW - 2, y + 6.8, { align: 'right' });

    return y + 14;
}

function sectionTitle(doc, text, y) {
    doc.setFillColor(...BRAND_PINK);
    doc.roundedRect(ML, y, CW, 9, 1.5, 1.5, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(text, ML + 5, y + 6.3);
    return y + 15;
}

// ── Export modes ─────────────────────────────────────────────────────────
function generateFull(doc, plan, includeExercise) {
    let y = CONTENT_TOP;
    plan.days.forEach((day) => {
        y = ensureSpace(doc, y, 30);
        const tot = calcDayTotals(day);
        y = dayBanner(doc, y, `Day ${day.dayNumber}${day.restDay ? ' — Rest Day' : ''}`, tot, includeExercise);

        if (day.restDay) {
            doc.setTextColor(...MID_GRAY);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text('Rest day — focus on recovery, light walking, and stretching.', ML + 4, y + 4);
            y += 14;
            return;
        }

        const rows = [];
        (day.meals || []).forEach((meal) => {
            if (!meal.foods?.length) return;
            const mTot = meal.foods.reduce((s, f) => ({
                cal: s.cal + f.calories * f.quantity, p: s.p + f.protein * f.quantity,
                c: s.c + f.carbs * f.quantity, fat: s.fat + f.fats * f.quantity,
            }), { cal: 0, p: 0, c: 0, fat: 0 });
            meal.foods.forEach((food, fi) => {
                rows.push({
                    cells: [
                        fi === 0 ? meal.label : '', food.name,
                        `${food.servingSize || ''}${food.quantity !== 1 ? ` x${food.quantity}` : ''}`,
                        String(Math.round(food.calories * food.quantity)), String(Math.round(food.protein * food.quantity)),
                        String(Math.round(food.carbs * food.quantity)), String(Math.round(food.fats * food.quantity)),
                    ],
                    bold: fi === 0,
                });
            });
            rows.push({ cells: ['', 'Meal Total', '', String(Math.round(mTot.cal)), String(Math.round(mTot.p)), String(Math.round(mTot.c)), String(Math.round(mTot.fat))], isTotal: true });
        });

        if (rows.length) {
            y = drawTable(doc, {
                startY: y,
                columns: [
                    { label: 'MEAL', w: 26 }, { label: 'FOOD ITEM', w: 58 }, { label: 'SERVING', w: 30 },
                    { label: 'CAL', w: 15, align: 'right' }, { label: 'P(g)', w: 15, align: 'right' },
                    { label: 'C(g)', w: 15, align: 'right' }, { label: 'F(g)', w: 15, align: 'right' },
                ],
                rows,
            });
            y += 4;
        }

        if (includeExercise && day.exercises?.length) {
            y = ensureSpace(doc, y, 20);
            y = drawTable(doc, {
                startY: y,
                columns: [
                    { label: 'EXERCISE', w: 60 }, { label: 'MUSCLE', w: 40 },
                    { label: 'VOLUME', w: 50 }, { label: 'BURN', w: 24, align: 'right' },
                ],
                rows: day.exercises.map((ex) => ({
                    cells: [ex.name, ex.muscleGroup, ex.duration || `${ex.sets} x ${ex.reps}`, `~${ex.caloriesBurned}`],
                })),
            });
            y += 4;
        }

        if (day.notes) {
            doc.setTextColor(...MID_GRAY);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`Note: ${day.notes}`, ML + 4, y + 4, { maxWidth: CW - 8 });
            y += 10;
        }
        y += 6;
    });
}

function generateMacrosPerMeal(doc, plan) {
    let y = CONTENT_TOP;
    plan.days.forEach((day) => {
        y = ensureSpace(doc, y, 30);
        const tot = calcDayTotals(day);
        y = dayBanner(doc, y, `Day ${day.dayNumber}${day.restDay ? ' — Rest Day' : ''}`, tot, false);
        if (day.restDay) { y += 8; return; }

        const rows = (day.meals || []).filter((m) => m.foods?.length).map((meal) => {
            const mTot = meal.foods.reduce((s, f) => ({
                cal: s.cal + f.calories * f.quantity, p: s.p + f.protein * f.quantity,
                c: s.c + f.carbs * f.quantity, fat: s.fat + f.fats * f.quantity,
            }), { cal: 0, p: 0, c: 0, fat: 0 });
            const items = meal.foods.map((f) => `${f.name}${f.quantity !== 1 ? ` x${f.quantity}` : ''}`).join(', ');
            return { cells: [meal.label, items, String(Math.round(mTot.cal)), String(Math.round(mTot.p)), String(Math.round(mTot.c)), String(Math.round(mTot.fat))] };
        });
        rows.push({ cells: ['DAILY TOTAL', '', String(tot.calories), String(tot.protein), String(tot.carbs), String(tot.fats)], isTotal: true });

        y = drawTable(doc, {
            startY: y,
            columns: [
                { label: 'MEAL', w: 28 }, { label: 'FOODS', w: 92 },
                { label: 'CAL', w: 16, align: 'right' }, { label: 'P(g)', w: 16, align: 'right' },
                { label: 'C(g)', w: 16, align: 'right' }, { label: 'F(g)', w: 14, align: 'right' },
            ],
            rows,
        });
        y += 10;
    });
}

function generateSummary(doc, plan, includeExercise) {
    let y = sectionTitle(doc, 'Weekly / Plan Overview', CONTENT_TOP);

    const rows = plan.days.map((day) => {
        const tot = calcDayTotals(day);
        const mealCount = (day.meals || []).reduce((s, m) => s + (m.foods?.length || 0), 0);
        return {
            cells: [
                `Day ${day.dayNumber}`,
                day.restDay ? 'Rest Day' : String(tot.calories),
                day.restDay ? '-' : String(tot.protein),
                day.restDay ? '-' : String(tot.carbs),
                day.restDay ? '-' : String(tot.fats),
                includeExercise ? (day.restDay ? '-' : `~${tot.caloriesBurned}`) : '-',
                day.restDay ? 'Rest' : `${mealCount} items`,
            ],
        };
    });

    drawTable(doc, {
        startY: y,
        columns: [
            { label: 'DAY', w: 24 }, { label: 'CALORIES', w: 26, align: 'right' }, { label: 'PROTEIN(g)', w: 26, align: 'right' },
            { label: 'CARBS(g)', w: 26, align: 'right' }, { label: 'FATS(g)', w: 24, align: 'right' },
            { label: 'BURN(kcal)', w: 28, align: 'right' }, { label: 'FOOD ITEMS', w: 28 },
        ],
        rows,
    });
}

function generateDietOnly(doc, plan) {
    let y = CONTENT_TOP;
    plan.days.forEach((day) => {
        y = ensureSpace(doc, y, 25);
        y = dayBanner(doc, y, `Day ${day.dayNumber}${day.restDay ? ' — Rest Day' : ''}`, calcDayTotals(day), false);
        if (day.restDay) { y += 8; return; }

        const rows = [];
        (day.meals || []).forEach((meal) => {
            if (!meal.foods?.length) return;
            meal.foods.forEach((food, fi) => {
                rows.push({
                    cells: [
                        fi === 0 ? meal.label : '', food.name,
                        `${food.servingSize || ''}${food.quantity !== 1 ? ` x${food.quantity}` : ''}`,
                        `${Math.round(food.calories * food.quantity)} kcal`,
                    ],
                    bold: fi === 0,
                });
            });
        });

        if (rows.length) {
            y = drawTable(doc, {
                startY: y,
                columns: [{ label: 'MEAL', w: 30 }, { label: 'FOOD ITEM', w: 82 }, { label: 'SERVING/QTY', w: 44 }, { label: 'CALORIES', w: 26, align: 'right' }],
                rows,
            });
            y += 8;
        }
    });
}

const MODE_LABELS = {
    'full': 'Complete Diet & Exercise Plan',
    'macros-per-meal': 'Macros Per Meal Plan',
    'summary': 'Plan Summary Overview',
    'diet-only': 'Diet Plan',
};
const MODE_SUFFIX = {
    'full': 'Full_Plan', 'macros-per-meal': 'Macros_Per_Meal', 'summary': 'Summary', 'diet-only': 'Diet_Only',
};

function addHeaderFooter(doc, plan, pageNum, totalPages) {
    // Header
    doc.setFillColor(...BRAND_BLACK);
    doc.rect(0, 0, PW, 26, 'F');
    doc.setFillColor(...BRAND_PINK);
    doc.rect(0, 25, PW, 1.5, 'F');

    doc.setTextColor(...WHITE);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Fit', ML, 16);
    doc.setTextColor(...BRAND_PINK);
    doc.text('withsudarshan', ML + doc.getTextWidth('Fit'), 16);

    doc.setTextColor(...LIGHT_GRAY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('RECODE™ Transformation System', ML, 22);

    doc.setTextColor(...LIGHT_GRAY);
    doc.setFontSize(7.5);
    doc.text(`Client: ${plan.client_name}`, PW - MR, 14, { align: 'right' });
    doc.text(`Page ${pageNum} of ${totalPages}`, PW - MR, 21, { align: 'right' });

    // Footer
    doc.setFillColor(...BRAND_BLACK);
    doc.rect(0, PH - 12, PW, 12, 'F');
    doc.setFillColor(...BRAND_PINK);
    doc.rect(0, PH - 12, PW, 1.2, 'F');
    doc.setTextColor(...MID_GRAY);
    doc.setFontSize(6.5);
    const trainerLine = `${plan.trainer_name || 'RECODE Coach'}${plan.trainer_contact ? ' | ' + plan.trainer_contact : ''} | Generated ${new Date().toLocaleDateString('en-IN')}`;
    doc.text(trainerLine, PW / 2, PH - 4.5, { align: 'center' });
}

export function generateDietPlanPDF(plan, { mode = 'full', includeInstructions = true } = {}) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Cover block
    let y = CONTENT_TOP;
    doc.setFillColor(20, 20, 20);
    doc.roundedRect(ML, y, CW, 34, 3, 3, 'F');
    doc.setFillColor(...BRAND_PINK);
    doc.roundedRect(ML, y, 4, 34, 1.5, 1.5, 'F');

    doc.setTextColor(...BRAND_PINK);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(MODE_LABELS[mode], ML + 9, y + 11);

    doc.setTextColor(...LIGHT_GRAY);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const trainerLine = `Prepared by: ${plan.trainer_name || 'RECODE Coach'}${plan.trainer_qualification ? ' — ' + plan.trainer_qualification : ''}`;
    doc.text(trainerLine, ML + 9, y + 19);

    const details = [
        plan.client_name, plan.client_age ? `Age: ${plan.client_age}` : null, plan.client_gender,
        plan.client_height ? `${plan.client_height} cm` : null,
        plan.client_weight ? `${plan.client_weight} kg → ${plan.target_weight || '—'} kg` : null,
        plan.goal, plan.diet_preference, `${plan.plan_duration} Days`,
    ].filter(Boolean);
    doc.setFontSize(7.5);
    doc.text(details.join('   ·   '), ML + 9, y + 27, { maxWidth: CW - 18 });
    y += 42;

    switch (mode) {
        case 'full': generateFull(doc, plan, plan.include_exercise); break;
        case 'macros-per-meal': generateMacrosPerMeal(doc, plan); break;
        case 'summary': generateSummary(doc, plan, plan.include_exercise); break;
        case 'diet-only': generateDietOnly(doc, plan); break;
        default: generateFull(doc, plan, plan.include_exercise);
    }

    if (includeInstructions) {
        doc.addPage();
        let iy = sectionTitle(doc, 'General Guidelines', CONTENT_TOP);
        const tips = [
            '1. Drink 8-10 glasses of water daily.',
            '2. Stick to meal timings as closely as possible.',
            '3. Avoid processed foods, sugary drinks, and fried snacks.',
            '4. Aim for 7-8 hours of quality sleep each night.',
            '5. Warm up before every workout; cool down and stretch after.',
            '6. Track your progress every week (weight + measurements).',
            '7. Consult your coach before making any modifications.',
            '8. Stay consistent — results take time and dedication.',
        ];
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GRAY);
        tips.forEach((tip) => { doc.text(tip, ML + 4, iy); iy += 7.5; });

        if (plan.client_notes) {
            iy += 4;
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(ML, iy, CW, 22, 2, 2, 'F');
            doc.setFillColor(...BRAND_PINK);
            doc.roundedRect(ML, iy, 3, 22, 1, 1, 'F');
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Trainer Notes:', ML + 7, iy + 7);
            doc.setFont('helvetica', 'normal');
            doc.text(plan.client_notes, ML + 7, iy + 15, { maxWidth: CW - 14 });
        }
    }

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        addHeaderFooter(doc, plan, p, totalPages);
    }

    const fileName = `${(plan.client_name || 'Client').replace(/\s+/g, '_')}_${MODE_SUFFIX[mode] || 'Plan'}.pdf`;
    doc.save(fileName);
    return fileName;
}
