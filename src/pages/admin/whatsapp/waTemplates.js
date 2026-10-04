/**
 * Built-in WhatsApp message templates for FitWithSudarshan.
 *
 * Conventions:
 *  - {{first_name}} / {{name}}  → filled in automatically per person.
 *  - [SQUARE BRACKETS]          → must be edited before sending (offer, code,
 *                                 date…). Sending is blocked while any remain,
 *                                 so a placeholder coupon never reaches a client.
 *  - *bold* / _italic_          → WhatsApp formatting.
 *  - months: calendar months (1–12) the occasion usually falls in, used to
 *    surface "Coming up" templates. Lunar festivals move every year, so these
 *    are approximate; [] = any time.
 */

export const SITE = 'https://fitwithsudarshan.com';

export const TEMPLATE_CATEGORIES = [
    { id: 'festival', label: 'Festivals', emoji: '🪔' },
    { id: 'promo', label: 'Offers & promos', emoji: '🔥' },
    { id: 'engage', label: 'Engagement', emoji: '💪' },
    { id: 'occasion', label: 'Occasions', emoji: '🎉' },
    { id: 'winback', label: 'Follow-up & win-back', emoji: '🔁' },
];

/** Matches an unfilled [PLACEHOLDER]. */
export const PLACEHOLDER_RE = /\[[^\]\n]{2,60}\]/g;

export function findPlaceholders(...texts) {
    return [...new Set(texts.filter(Boolean).flatMap((t) => String(t).match(PLACEHOLDER_RE) || []))];
}

export const WA_TEMPLATES = [
    // ── Festivals ────────────────────────────────────────────────────────
    {
        id: 'makar-sankranti', category: 'festival', months: [1], title: 'Makar Sankranti', when: 'Jan 14',
        body: "🪁 Happy Makar Sankranti, {{first_name}}!\n\nTil-gul ghya, god god bola 🙏\n\nThe sun moves north and the days get longer. A great time to set your fitness direction for the year too.\n\n*Sankranti offer:* [OFFER, e.g. 15% off any plan] with code *[CODE]*, till *[LAST DATE]*.",
        cta_label: 'See plans', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'republic-day', category: 'festival', months: [1], title: 'Republic Day', when: 'Jan 26',
        body: "🇮🇳 Happy Republic Day, {{first_name}}!\n\nA strong nation is built by strong, healthy people.\n\nThis week, give yourself a constitution of your own: *3 workouts, 8 glasses of water, 7 hours of sleep*. Simple rules, real results.\n\nWant a plan built around your routine? Reply *PLAN* and I'll guide you.",
        cta_label: '', cta_url: '',
    },
    {
        id: 'valentines', category: 'festival', months: [2], title: "Valentine's Day — couple plan", when: 'Feb 14',
        body: "❤️ This Valentine's, skip the chocolates and gift something that lasts: *a healthier life together.*\n\nCouples who train together stay consistent (and motivated) together.\n\n*RECODE Couple Plan:* [OFFER, e.g. ₹2,000 off for both] till *[LAST DATE]*.\n\nTag your partner and let's start 💪",
        cta_label: 'Couple plans', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'womens-day', category: 'festival', months: [3], title: "Women's Day", when: 'Mar 8',
        body: "💐 Happy Women's Day, {{first_name}}!\n\nStrength training isn't about getting bulky. It's about strong bones, better hormones, more energy and confidence that shows.\n\nThis week only: *[OFFER, e.g. free body-composition review]* for every woman who starts a plan.\n\nYou deserve to feel strong. 💪",
        cta_label: 'Start my plan', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'holi', category: 'festival', months: [3], title: 'Holi', when: 'Mar',
        body: "🎨 Happy Holi, {{first_name}}!\n\nColours on the outside, strength on the inside 💪\n\nEnjoy the gujiya and thandai, then let's wash off the excess along with the colour 😄\n\n*Holi offer:* [OFFER] with code *[CODE]*, valid till *[LAST DATE]*.",
        cta_label: 'Claim offer', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'gudi-padwa', category: 'festival', months: [3, 4], title: 'Gudi Padwa / Ugadi', when: 'Mar–Apr',
        body: "🚩 Gudi Padwachya hardik shubhechha, {{first_name}}!\n\nNew year, new beginnings. Raise your gudi, and raise your standards for your health this year.\n\nStart your RECODE journey this week and get *[OFFER]*.\n\nNav varsh, nava sharir 💪",
        cta_label: 'Start fresh', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'eid', category: 'festival', months: [], title: 'Eid Mubarak', when: 'Varies',
        body: "🌙 Eid Mubarak, {{first_name}}!\n\nAfter a month of discipline and fasting, your body is primed for a fresh start. Let's build on that discipline the right way, with balanced meals and smart training.\n\nReply *EID* for a free post-Ramadan nutrition guide.",
        cta_label: '', cta_url: '',
    },
    {
        id: 'world-health-day', category: 'festival', months: [4], title: 'World Health Day', when: 'Apr 7',
        body: "🩺 It's World Health Day, {{first_name}}.\n\nQuick self-check:\n✅ Do you sleep 7+ hours?\n✅ Walk 7,000+ steps a day?\n✅ Eat protein in every meal?\n✅ Train at least 3× a week?\n\nIf you ticked fewer than 3, let's fix that together. Book a free consultation 👇",
        cta_label: 'Free consultation', cta_url: `${SITE}/#contact`,
    },
    {
        id: 'yoga-day', category: 'festival', months: [6], title: 'International Yoga Day', when: 'Jun 21',
        body: "🧘 Happy International Yoga Day, {{first_name}}!\n\nMobility is the most ignored part of fitness, and the reason most people get injured.\n\nToday's challenge: *10 minutes of stretching* before bed. Your back, hips and sleep will thank you.\n\nWant a full mobility + strength routine? Reply *YOGA*.",
        cta_label: '', cta_url: '',
    },
    {
        id: 'monsoon', category: 'festival', months: [6, 7, 8], title: 'Monsoon home workouts', when: 'Jun–Aug',
        body: "🌧️ Rain outside, {{first_name}}? No excuse inside 😄\n\nMonsoon is when most people fall off track. Our online coaching gives you *home workouts that need zero equipment* plus immunity-friendly meal plans.\n\n*Monsoon offer:* [OFFER] till *[LAST DATE]*.",
        cta_label: 'Train from home', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'independence-day', category: 'festival', months: [8], title: 'Independence Day', when: 'Aug 15',
        body: "🇮🇳 Happy Independence Day, {{first_name}}!\n\nThis year, celebrate a different kind of freedom:\n🔓 From back pain\n🔓 From low energy\n🔓 From crash diets that never last\n\n*Freedom offer:* [OFFER] with code *[CODE]*, till *[LAST DATE]*.",
        cta_label: 'Get my plan', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'raksha-bandhan', category: 'festival', months: [8], title: 'Raksha Bandhan', when: 'Aug',
        body: "🧵 Happy Raksha Bandhan, {{first_name}}!\n\nThis year, gift your sibling something better than chocolates: *a promise of good health* 💪\n\nSign up together and get *[OFFER, e.g. ₹1,500 off for both]*. Offer valid till *[LAST DATE]*.",
        cta_label: 'Gift a plan', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'ganesh-chaturthi', category: 'festival', months: [8, 9], title: 'Ganesh Chaturthi', when: 'Aug–Sep',
        body: "🙏 Ganpati Bappa Morya, {{first_name}}!\n\nMay Bappa remove every obstacle, including the ones between you and your fitness goals 😄\n\nEnjoy the modaks! Once the festival ends, we'll help you reset with a simple, no-starvation plan.\n\n*Bappa special:* [OFFER] till *[LAST DATE]*.",
        cta_label: 'See plans', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'post-ganpati', category: 'festival', months: [9], title: 'Post-Ganpati reset', when: 'Sep',
        body: "Ganpati festival is over.\nThe modaks are over.\nBut the excuses? Not yet 😄\n\n{{first_name}}, this is the best time to restart before Navratri and Diwali arrive.\n\nJoin the *[NUMBER]-day RECODE reset challenge* starting *[START DATE]*.",
        cta_label: 'Join the challenge', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'navratri', category: 'festival', months: [9, 10], title: 'Navratri', when: 'Sep–Oct',
        body: "💃 Shubh Navratri, {{first_name}}!\n\nFun fact: 2 hours of garba can burn *500–700 calories* 🔥\n\nFasting this Navratri? Reply *FAST* and I'll send you a free fasting-friendly meal guide that keeps your energy up for garba nights.",
        cta_label: '', cta_url: '',
    },
    {
        id: 'dussehra', category: 'festival', months: [10], title: 'Dussehra', when: 'Oct',
        body: "🏹 Happy Dussehra, {{first_name}}!\n\nToday we celebrate good over evil. Time to defeat your own Raavan too: *laziness, junk food and late nights* 😄\n\nStart on this auspicious day and get *[OFFER]* with code *[CODE]*.",
        cta_label: 'Start today', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'diwali', category: 'festival', months: [10, 11], title: 'Diwali offer', when: 'Oct–Nov',
        body: "🪔 Happy Diwali, {{first_name}}!\n\nThis year, light up more than diyas. Gift yourself a stronger, healthier you ✨\n\n*Diwali offer:* [OFFER, e.g. 20% off any 3-month plan]\nCode: *[CODE]*\nValid till: *[LAST DATE]*\n\nEnjoy the sweets, and leave the plan to us 😉",
        cta_label: 'Claim Diwali offer', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'post-diwali', category: 'festival', months: [11], title: 'Post-Diwali detox', when: 'Nov',
        body: "Diwali is over.\nThe sweets are over.\nBut the extra kilos? Still here 😄\n\n{{first_name}}, no crash diets and no guilt. Just a smart *[NUMBER]-day reset* to get your energy and digestion back on track.\n\nStarts *[START DATE]*. Limited spots.",
        cta_label: 'Join the reset', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'christmas', category: 'festival', months: [12], title: 'Christmas', when: 'Dec 25',
        body: "🎄 Merry Christmas, {{first_name}}!\n\nSanta's gift for you this year: *[OFFER]* on any RECODE plan, code *[CODE]* 🎁\n\nStart before the New Year rush and walk into January already ahead.",
        cta_label: 'Unwrap offer', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'new-year', category: 'festival', months: [12, 1], title: 'New Year resolution', when: 'Dec–Jan',
        body: "🎆 Happy New Year, {{first_name}}!\n\n80% of fitness resolutions fail by February. Not because people are lazy, but because they don't have a plan.\n\nThis year, let's make yours stick with a plan built for *your* body, food and schedule.\n\n*New Year offer:* [OFFER] till *[LAST DATE]*.",
        cta_label: 'Make it stick', cta_url: `${SITE}/#pricing`,
    },

    // ── Offers & promotions ──────────────────────────────────────────────
    {
        id: 'founding-member', category: 'promo', months: [], title: 'Founding member pricing',
        body: "🔥 {{first_name}}, founding member pricing is almost gone.\n\nOnly *[NUMBER] spots* left at the launch price. After that, prices go up.\n\nLock in your rate today and keep it for life on renewals.",
        cta_label: 'Lock my price', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'flash-sale', category: 'promo', months: [], title: '48-hour flash sale',
        body: "⚡ *48-HOUR FLASH SALE* ⚡\n\n{{first_name}}, for the next 48 hours only:\n👉 *[OFFER]* on every coaching plan\n👉 Code: *[CODE]*\n\nEnds *[LAST DATE]* at midnight. No extensions.",
        cta_label: 'Grab it now', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'new-batch', category: 'promo', months: [], title: 'New batch starting',
        body: "📅 New RECODE batch starts *[START DATE]*!\n\nHey {{first_name}}, we're opening *[NUMBER] spots* for the next transformation batch:\n✅ Personalised diet + workout plan\n✅ Weekly check-ins on WhatsApp\n✅ Progress tracking every 2 weeks\n\nReply *JOIN* to reserve your spot.",
        cta_label: 'Reserve my spot', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'challenge', category: 'promo', months: [], title: 'Fitness challenge invite',
        body: "🏆 *#[NUMBER]DaysChallenge* is here!\n\n{{first_name}}, ready to see what you can do in [NUMBER] days?\n\n📍 Starts: *[START DATE]*\n💰 Entry: *[PRICE]*\n🎁 Best transformation wins *[PRIZE]*\n\nTap below and fill the form to join.",
        cta_label: 'Join now', cta_url: `${SITE}/#contact`,
    },
    {
        id: 'referral', category: 'promo', months: [], title: 'Refer a friend',
        body: "🤝 {{first_name}}, know someone who keeps saying “I'll start from Monday”? 😄\n\nRefer them to RECODE:\n🎁 They get *[OFFER FOR FRIEND]*\n🎁 You get *[REWARD FOR YOU]*\n\nJust share their name and number here.",
        cta_label: '', cta_url: '',
    },
    {
        id: 'couple-plan', category: 'promo', months: [], title: 'Couple plan',
        body: "👫 Train together, transform together.\n\n{{first_name}}, our *Couple Plan* gives you and your partner individual diet plans, shared accountability and *one price for two*.\n\nThis month: *[OFFER]*.",
        cta_label: 'Couple plans', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'free-consult', category: 'promo', months: [], title: 'Free consultation',
        body: "Hi {{first_name}} 👋\n\nNot sure where to start? Book a *free 15-minute consultation* with me. We'll look at your goals, routine and food habits, and I'll tell you honestly what will work for you.\n\nNo pressure, no hard sell.",
        cta_label: 'Book free call', cta_url: `${SITE}/#contact`,
    },
    {
        id: 'price-increase', category: 'promo', months: [], title: 'Price increase notice',
        body: "📢 Heads-up, {{first_name}}:\n\nRECODE coaching prices increase from *[DATE]*.\n\nIf you've been thinking about starting, this is the week. Anyone who joins before *[DATE]* keeps the current price.",
        cta_label: 'Join at current price', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'last-chance', category: 'promo', months: [], title: 'Last-chance reminder',
        body: "⏰ Last call, {{first_name}}!\n\nThe *[OFFER NAME]* ends *tonight at midnight*. After that it's back to regular pricing.\n\nOnly *[NUMBER] spots* left.",
        cta_label: 'Claim before midnight', cta_url: `${SITE}/#pricing`,
    },

    // ── Engagement ───────────────────────────────────────────────────────
    {
        id: 'transformation-story', category: 'engage', months: [], title: 'Client transformation',
        body: "💪 *Real result:* [CLIENT FIRST NAME] lost *[KG] kg* in *[WEEKS] weeks*, without giving up home food.\n\n{{first_name}}, your journey can inspire others too.\n\nAttach the before/after photo above ☝️ (with the client's permission).",
        cta_label: 'Get more details', cta_url: `${SITE}/#transformations`,
    },
    {
        id: 'weekly-tip', category: 'engage', months: [], title: 'Weekly fitness tip',
        body: "💡 *Tip of the week*\n\n{{first_name}}, add *20–30 g of protein to breakfast*: eggs, paneer, curd or sprouts.\n\nIt keeps you full till lunch and cuts evening cravings almost in half.\n\nTry it for 7 days and tell me the difference 👇",
        cta_label: '', cta_url: '',
    },
    {
        id: 'free-resource', category: 'engage', months: [], title: 'Free guide / PDF',
        body: "🎁 Free for you, {{first_name}}:\n\n*[GUIDE NAME, e.g. The Indian Home-Food Fat-Loss Guide]*\n\nReal meals: dal, roti, rice, sabzi. No fancy ingredients.\n\nDownload below 👇",
        cta_label: 'Download free', cta_url: '[GUIDE LINK]',
    },
    {
        id: 'weekend-checkin', category: 'engage', months: [], title: 'Weekend check-in',
        body: "Hey {{first_name}} 👋 Weekend check-in!\n\nReply with a number:\n1️⃣ Crushed it this week\n2️⃣ Mostly on track\n3️⃣ Struggled, need help\n\nNo judgement. I'm here either way 💪",
        cta_label: '', cta_url: '',
    },
    {
        id: 'review-request', category: 'engage', months: [], title: 'Ask for a review',
        body: "Hi {{first_name}} 🙏\n\nIt's been amazing coaching you! Would you take 1 minute to share your experience? It helps others take their first step.\n\nThank you so much ❤️",
        cta_label: 'Leave a review', cta_url: '[REVIEW LINK]',
    },

    // ── Occasions (personal) ─────────────────────────────────────────────
    {
        id: 'welcome', category: 'occasion', months: [], title: 'Welcome new client',
        body: "🎉 Welcome to RECODE, {{first_name}}!\n\nI'm really glad you're here. Over the next 24 hours you'll receive:\n1️⃣ Your onboarding form\n2️⃣ Your personalised diet plan\n3️⃣ Your workout plan\n\nSave this number. This is your direct line to me 💪",
        cta_label: '', cta_url: '',
    },
    {
        id: 'birthday', category: 'occasion', months: [], title: 'Birthday wish',
        body: "🎂 Happy Birthday, {{first_name}}!\n\nWishing you a year of strength, energy and great health 💪\n\nEnjoy the cake today, guilt-free! 🍰\n\nAs a small gift: *[BIRTHDAY OFFER]* on your next renewal.",
        cta_label: '', cta_url: '',
    },
    {
        id: 'anniversary', category: 'occasion', months: [], title: 'Fitness anniversary',
        body: "🥳 {{first_name}}, it's been *[MONTHS] months* since you started with RECODE!\n\nLook how far you've come. Proud of every early workout and every “no” to junk food.\n\nHere's to the next chapter 💪",
        cta_label: '', cta_url: '',
    },
    {
        id: 'plan-ending', category: 'occasion', months: [], title: 'Plan ending soon',
        body: "Hi {{first_name}} 👋\n\nYour RECODE plan ends on *[END DATE]*. You've built great momentum, so let's not lose it!\n\nRenew before *[END DATE]* and get *[RENEWAL OFFER]*.",
        cta_label: 'Renew my plan', cta_url: `${SITE}/#pricing`,
    },

    // ── Follow-up & win-back ─────────────────────────────────────────────
    {
        id: 'lead-followup', category: 'winback', months: [], title: 'Lead follow-up',
        body: "Hi {{first_name}} 👋\n\nYou'd asked about coaching a few days back. Just checking in. Any questions I can answer?\n\nMost people tell me their biggest worry is *“Will I have to give up home food?”* The answer is no 😄",
        cta_label: 'See plans', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'form-reminder', category: 'winback', months: [], title: 'Form not filled',
        body: "Hey {{first_name}}, you're just one step away from your transformation!\n\nPlease fill the quick form so I can understand your goals and build your plan.\n\n_Ignore this message if you've already filled it._",
        cta_label: 'Fill form', cta_url: `${SITE}/onboarding`,
    },
    {
        id: 'expired-winback', category: 'winback', months: [], title: 'Expired client win-back',
        body: "Hey {{first_name}}, it's Sudarshan 👋\n\nIt's been a while! How's your fitness going?\n\nIf you're ready to get back on track, here's a *welcome-back offer* just for past clients: *[OFFER]* till *[LAST DATE]*.\n\nYour progress doesn't have to start from zero.",
        cta_label: 'Come back', cta_url: `${SITE}/#pricing`,
    },
    {
        id: 'we-miss-you', category: 'winback', months: [], title: "Haven't heard from you",
        body: "Hi {{first_name}}, haven't heard from you in a while. Everything okay? 🙂\n\nLife gets busy. If you just want a *simple 3-day-a-week routine* to get back into it, reply *RESTART* and I'll send one, free.",
        cta_label: '', cta_url: '',
    },
];

/** Templates whose occasion is this month or next (for the "Coming up" row). */
export function upcomingTemplates(now = new Date()) {
    const m = now.getMonth() + 1;
    const next = (m % 12) + 1;
    return WA_TEMPLATES.filter((t) => t.months.includes(m) || t.months.includes(next));
}

// ── Day-wise sequence presets ────────────────────────────────────────────
export const SEQUENCE_PRESETS = [
    {
        id: 'onboarding',
        name: 'Challenge onboarding (3 days)',
        description: 'Welcome + form link, a reminder, then social proof.',
        steps: [
            { day_number: 1, body: "Hey {{first_name}} 👋, let's get your fitness journey started!\n\nTap below and fill the form so I can build your RECODE plan.", cta_label: 'Fill the form', cta_url: `${SITE}/onboarding` },
            { day_number: 2, body: "Hey {{first_name}}, you're just one step away from your transformation. Please fill the form so I can understand your goals.\n\n_Ignore this if you've already filled it._", cta_label: 'Fill form', cta_url: `${SITE}/onboarding` },
            { day_number: 4, body: "{{first_name}}, here's a real result from our last batch 💪 Your journey can inspire others too.", cta_label: 'Get more details', cta_url: `${SITE}/#transformations` },
        ],
    },
    {
        id: 'lead-nurture',
        name: 'Lead nurture (5 messages / 10 days)',
        description: 'Turns enquiries into clients: value first, offer last.',
        steps: [
            { day_number: 1, body: "Hi {{first_name}} 👋 Thanks for reaching out! I'm Sudarshan, your RECODE coach.\n\nQuick question: what's your #1 goal right now? Fat loss, muscle gain, or just feeling fit again?", cta_label: '', cta_url: '' },
            { day_number: 3, body: "💡 {{first_name}}, the #1 mistake I see: eating too little protein.\n\nAim for a palm-sized portion of dal, paneer, eggs, chicken or curd in *every* meal. Try it this week.", cta_label: '', cta_url: '' },
            { day_number: 5, body: "💪 Real result: [CLIENT FIRST NAME] lost [KG] kg in [WEEKS] weeks, eating home food the whole time.\n\n{{first_name}}, that could be you.", cta_label: 'See transformations', cta_url: `${SITE}/#transformations` },
            { day_number: 7, body: "Hi {{first_name}}, would a *free 15-minute call* help? We'll map out exactly what you need. No pressure.", cta_label: 'Book free call', cta_url: `${SITE}/#contact` },
            { day_number: 10, body: "{{first_name}}, last message from me on this 🙂\n\nIf you start this week, I'll add *[BONUS, e.g. a free extra week]* to your plan. Just reply *START*.", cta_label: 'See plans', cta_url: `${SITE}/#pricing` },
        ],
    },
    {
        id: 'new-client',
        name: 'New client first week (4 messages)',
        description: 'Keeps new clients on track through the first 7 days.',
        steps: [
            { day_number: 1, body: "🎉 Welcome to RECODE, {{first_name}}! Your plan is on its way. Save this number. This is your direct line to me 💪", cta_label: '', cta_url: '' },
            { day_number: 2, body: "Day 2 check-in, {{first_name}} ✅\n\nDid you manage your water target yesterday? Reply with a 👍 or tell me what got in the way.", cta_label: '', cta_url: '' },
            { day_number: 4, body: "{{first_name}}, the first week is the hardest, and you're getting through it 🔥\n\nFeeling sore? That's normal. Keep moving, stretch for 5 minutes tonight.", cta_label: '', cta_url: '' },
            { day_number: 7, body: "🥳 One week done, {{first_name}}!\n\nSend me today's weight and a quick photo (front + side) so we can track progress.", cta_label: '', cta_url: '' },
        ],
    },
    {
        id: 'festival-reset',
        name: 'Post-festival reset challenge (7 days)',
        description: 'A daily-motivation mini challenge after Diwali, Ganpati or the holidays.',
        steps: [
            { day_number: 1, body: "🔥 *Reset Day 1*, {{first_name}}!\n\nToday: 8 glasses of water + 6,000 steps. That's it. Reply ✅ when done.", cta_label: '', cta_url: '' },
            { day_number: 2, body: "*Reset Day 2* 🥗\n\nToday: protein in every meal + no sugar after 6 pm.", cta_label: '', cta_url: '' },
            { day_number: 3, body: "*Reset Day 3* 💪\n\nToday: 20-minute home workout: 3 rounds of 15 squats, 10 push-ups, 30-sec plank.", cta_label: '', cta_url: '' },
            { day_number: 4, body: "*Reset Day 4* 😴\n\nToday: phone away 30 minutes before bed. Sleep is where fat loss happens.", cta_label: '', cta_url: '' },
            { day_number: 5, body: "*Reset Day 5* 🚶\n\nToday: 10-minute walk after lunch AND dinner. Watch how your digestion improves.", cta_label: '', cta_url: '' },
            { day_number: 6, body: "*Reset Day 6* 🧘\n\nToday: 10 minutes of stretching. Hips, hamstrings, lower back.", cta_label: '', cta_url: '' },
            { day_number: 7, body: "🏆 *You finished the reset, {{first_name}}!*\n\nWant to keep this momentum going with a full personalised plan? Here's *[OFFER]* for challenge finishers.", cta_label: 'Continue with RECODE', cta_url: `${SITE}/#pricing` },
        ],
    },
];
