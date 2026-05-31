// ─── BRAND ────────────────────────────────────────────────────────────────────
export const brand = {
    name: "FitWithSudarshan",
    system: "RECODE™",
    tagline: "Recode Your Body. Recode Your Life.",
    positioning: "Recovery-Based Transformation System",
};

// ─── COACH ────────────────────────────────────────────────────────────────────
export const coach = {
    name: "Sudarshan Chavan",
    firstName: "Sudarshan",
    certifications: ["American College of Sports Medicine (ACSM)"],
    yearsExperience: "8+",
    clientsGuided: "200+",
    personalTransformation: "29kg",
    shortBio:
        "I'm Sudarshan Chavan, founder of RECODE™. After transforming my own body from 85kg to 56kg, I realized lasting transformation requires more than workouts and diets. Today, I help clients improve body composition, movement quality, strength, energy, and lifestyle through a structured recovery-based coaching system.",
    longBio:
        "My transformation journey started with a personal goal of losing weight. Through years of learning and coaching, I discovered that sustainable transformation comes from fixing the body's foundation first. Poor recovery, weak movement patterns, stress, lack of structure, and inconsistent habits are often the real reasons people struggle. This led to the creation of RECODE™ — a recovery-based transformation system built around five pillars: Recover → Regulate → Restructure → Rebuild → Redefine. Today, RECODE helps people achieve sustainable fat loss, muscle gain, better mobility, improved energy, and long-term lifestyle change without relying on extreme methods.",
    stats: [
        { value: "29kg", label: "Personal Transformation" },
        { value: "200+", label: "Clients Guided" },
        { value: "8+", label: "Years Experience" },
        { value: "ACSM", label: "Certified Coach" },
    ],
};

// ─── CONTACT ──────────────────────────────────────────────────────────────────
export const contact = {
    phone: "9619708124",
    email: "Fitwithsudarshanofficial@gmail.com",
    location: "Mumbai, Maharashtra, India",
    social: {
        instagram: "https://www.instagram.com/fitwithsudarshan",
        youtube: "https://youtube.com/@sudarshanchavan1833",
        whatsapp: "https://wa.me/919619708124",
    },
};

// ─── RECODE 5R METHOD ─────────────────────────────────────────────────────────
export const recodeMethod = [
    {
        step: "01",
        title: "RECOVER",
        description: "Restore energy, recovery, and resilience.",
        color: "from-emerald-500/20 to-teal-500/20",
        accent: "text-emerald-400",
    },
    {
        step: "02",
        title: "REGULATE",
        description: "Create balance through nutrition and lifestyle.",
        color: "from-blue-500/20 to-cyan-500/20",
        accent: "text-blue-400",
    },
    {
        step: "03",
        title: "RESTRUCTURE",
        description: "Improve posture, mobility, and movement quality.",
        color: "from-violet-500/20 to-purple-500/20",
        accent: "text-violet-400",
    },
    {
        step: "04",
        title: "REBUILD",
        description: "Build strength, muscle, and physical confidence.",
        color: "from-orange-500/20 to-amber-500/20",
        accent: "text-orange-400",
    },
    {
        step: "05",
        title: "REDEFINE",
        description: "Create a sustainable lifestyle and identity.",
        color: "from-rose-500/20 to-pink-500/20",
        accent: "text-rose-400",
    },
];

// ─── SERVICES ─────────────────────────────────────────────────────────────────
export const services = [
    {
        id: "online",
        title: "RECODE ONLINE",
        subtitle: "Personalized coaching accessible worldwide.",
        features: [
            "Customized Workout Plan",
            "Customized Nutrition Plan",
            "Progress Tracking",
            "Weekly Accountability",
            "WhatsApp Support",
            "Habit Coaching",
        ],
        badge: null,
        color: "from-emerald-500/20 to-teal-500/20",
        accent: "text-emerald-400",
    },
    {
        id: "consult",
        title: "RECODE CONSULT",
        subtitle: "One-on-one online consultation sessions.",
        features: [
            "Movement Assessment",
            "Lifestyle Review",
            "Nutrition Guidance",
            "Recovery Analysis",
            "Action Plan",
        ],
        badge: null,
        color: "from-blue-500/20 to-cyan-500/20",
        accent: "text-blue-400",
    },
    {
        id: "personal",
        title: "RECODE PERSONAL",
        subtitle: "Private one-on-one coaching in Mumbai.",
        features: [
            "Personal Training Sessions",
            "Mobility Work",
            "Strength Training",
            "Fat Loss Coaching",
            "Lifestyle Support",
        ],
        badge: "Limited Availability",
        color: "from-orange-500/20 to-amber-500/20",
        accent: "text-orange-400",
    },
    {
        id: "elite",
        title: "RECODE ELITE",
        subtitle: "Premium coaching for high performers.",
        features: [
            "Priority Support",
            "Weekly Strategy Calls",
            "Advanced Progress Tracking",
            "Customized Roadmap",
            "Lifestyle Optimization",
        ],
        badge: "Premium",
        color: "from-violet-500/20 to-purple-500/20",
        accent: "text-violet-400",
    },
];

// ─── PRICING ──────────────────────────────────────────────────────────────────
export const pricing = [
    {
        name: "RECODE FOUNDATION",
        duration: "Monthly",
        regularPrice: 599,
        foundingPrice: 599,
        isFoundingDifferent: false,
        features: [
            "Monthly Workout Plan",
            "Monthly Nutrition Guidelines",
            "RECODE Community Access",
            "Educational Resources",
            "Monthly Check-In",
        ],
        popular: false,
        cta: "Get Started",
        badge: null,
    },
    {
        name: "RECODE START",
        duration: "Monthly",
        regularPrice: 4999,
        foundingPrice: 2999,
        isFoundingDifferent: true,
        features: [
            "Customized Workout Plan",
            "Customized Nutrition Plan",
            "Weekly Accountability",
            "WhatsApp Support",
            "Habit Coaching",
            "Progress Tracking",
        ],
        popular: false,
        cta: "Apply Now",
        badge: null,
    },
    {
        name: "RECODE TRANSFORM",
        duration: "3 Months",
        regularPrice: 11999,
        foundingPrice: 7999,
        isFoundingDifferent: true,
        features: [
            "Everything in RECODE START",
            "3-Month Structured Program",
            "Bi-Weekly Check-ins",
            "Nutrition Plan Updates",
            "Recovery Protocols",
            "Movement Assessment",
        ],
        popular: true,
        cta: "Apply Now",
        badge: "Most Popular",
    },
    {
        name: "RECODE EVOLVE",
        duration: "6 Months",
        regularPrice: 20999,
        foundingPrice: 14999,
        isFoundingDifferent: true,
        features: [
            "Everything in TRANSFORM",
            "6-Month Full Transformation",
            "Weekly Strategy Calls",
            "Advanced Tracking",
            "Lifestyle Systems",
            "Priority WhatsApp",
            "Mobility Program",
        ],
        popular: false,
        cta: "Apply Now",
        badge: "Recommended",
    },
    {
        name: "RECODE ELITE",
        duration: "12 Months",
        regularPrice: 35999,
        foundingPrice: 24999,
        isFoundingDifferent: true,
        features: [
            "Everything in EVOLVE",
            "12-Month Full Journey",
            "Weekly 1:1 Calls",
            "Full Lifestyle Audit",
            "Custom Recovery Plan",
            "Competition Prep Ready",
            "Lifetime Community Access",
            "1-on-1 Accountability Partner",
        ],
        popular: false,
        cta: "Apply Now",
        badge: "Best Value",
    },
];

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
export const testimonials = [
    {
        id: 1,
        name: "Aayush",
        role: "RECODE Client",
        transformation: "82kg → 71kg",
        weightLost: "11kg Lost",
        quote:
            "RECODE changed the way I think about fitness. It wasn't just about losing weight — it was about understanding my body and building habits that actually last. Sudarshan's approach is unlike anything I've tried before.",
        rating: 5,
        avatar: null,
    },
    {
        id: 2,
        name: "Joshua",
        role: "RECODE Client",
        transformation: "15kg Lost",
        weightLost: "15kg Lost",
        quote:
            "I was skeptical about online coaching but the results speak for themselves. 15kg down, energy levels through the roof, and I've never felt stronger. The recovery focus made all the difference.",
        rating: 5,
        avatar: null,
    },
    {
        id: 3,
        name: "Raj",
        role: "RECODE Client",
        transformation: "85kg → 70kg",
        weightLost: "15kg Lost",
        quote:
            "As a busy professional, I needed something structured and flexible. RECODE gave me exactly that. The WhatsApp support and weekly accountability kept me on track even during the most hectic weeks.",
        rating: 5,
        avatar: null,
    },
    {
        id: 4,
        name: "Dr. Pramod",
        role: "Anaesthesiologist",
        transformation: "Lifestyle Transformation",
        weightLost: "Body Recomposition",
        quote:
            "As a doctor, I appreciate the evidence-based approach Sudarshan brings to coaching. The recovery-first methodology is exactly what the body needs. My sleep, energy, and performance have all improved significantly.",
        rating: 5,
        avatar: null,
    },
    {
        id: 5,
        name: "Sudarshan",
        role: "Coach & Founder",
        transformation: "85kg → 56kg",
        weightLost: "29kg Lost",
        quote:
            "My own 29kg transformation taught me that lasting change requires fixing the foundation first — recovery, regulation, structure. That's what RECODE is built on. Every client deserves a method that truly works.",
        rating: 5,
        avatar: null,
    },
];

// ─── BLOG POSTS ───────────────────────────────────────────────────────────────
export const blogPosts = [
    {
        id: 1,
        slug: "why-recovery-is-the-missing-piece",
        title: "Why Recovery Is the Missing Piece in Your Transformation",
        excerpt:
            "Most people train harder when results stall. The real answer is almost always the opposite. Here's why recovery is the most underrated tool in fitness.",
        category: "Recovery",
        readTime: "5 min read",
        date: "Jan 10, 2025",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=340&fit=crop&q=80",
        content: `
## Why Recovery Is the Missing Piece in Your Transformation

Most people train harder when results stall. More sessions. More cardio. Stricter diet.

The real answer is almost always the opposite.

### What Is Recovery, Really?

Recovery isn't just rest days. It's the full process by which your body adapts to training, repairs tissue, regulates hormones, and rebuilds energy systems.

Poor recovery shows up as:
- Persistent fatigue that doesn't go away with sleep
- Stalled progress despite consistent training
- Frequent illness or injury
- Mood swings, irritability, and brain fog
- Poor sleep quality

### The Stress-Recovery Equation

Your body cannot distinguish between training stress and life stress. Work deadlines, poor sleep, relationship tension, financial worry — these all count toward your total stress load.

When your stress bucket overflows, your body prioritizes survival over transformation. Fat loss slows. Muscle gain stops. Recovery takes longer.

### The RECODE Approach

In RECODE™, recovery is the first pillar for a reason. Before we optimize nutrition or add training volume, we assess and restore your recovery foundation:

1. **Sleep quality** — the single most powerful recovery tool
2. **Stress management** — regulating cortisol and the nervous system
3. **Movement quality** — reducing compensations that create chronic fatigue
4. **Nutrition timing** — supporting recovery through strategic eating

### Practical Steps to Improve Recovery

**Prioritize sleep consistency.** Go to bed and wake at the same time daily, even on weekends. This regulates your circadian rhythm and dramatically improves recovery quality.

**Create a wind-down routine.** 30-60 minutes before bed: dim lights, no screens, reduce stimulation. This shifts your nervous system from sympathetic (fight/flight) to parasympathetic (rest/digest).

**Eat enough.** Chronic undereating is one of the most common hidden saboteurs of recovery. You cannot repair and rebuild without adequate calories and protein.

**Move, don't just train.** Daily walks, light mobility work, and stretching actively support recovery without adding stress.

### The Bottom Line

If you've been grinding harder with diminishing returns, recovery is likely the missing piece. Train smart, recover harder, and watch your results accelerate.

This is the foundation of RECODE™.
    `,
    },
    {
        id: 2,
        slug: "fat-loss-without-starving",
        title: "Fat Loss Without Starving: The RECODE Nutrition Approach",
        excerpt:
            "Extreme calorie restriction slows your metabolism, kills muscle, and destroys your relationship with food. Here's a smarter way.",
        category: "Fat Loss",
        readTime: "6 min read",
        date: "Jan 18, 2025",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=340&fit=crop&q=80",
        content: `
## Fat Loss Without Starving: The RECODE Nutrition Approach

Extreme calorie restriction slows your metabolism, kills muscle, and destroys your relationship with food.

There is a smarter way.

### The Problem With Most Fat Loss Diets

Most diets operate on one principle: eat as little as possible.

This works temporarily. Then it stops working. Here's why:

**Metabolic adaptation** — your body is smart. When you chronically undereat, it downregulates metabolism to match your intake. Fat loss stalls.

**Muscle loss** — without adequate protein and progressive training, your body breaks down muscle for energy. You get lighter but not leaner.

**Hormonal disruption** — severe restriction elevates cortisol, suppresses testosterone and thyroid function, and disrupts hunger hormones (leptin and ghrelin).

**Rebound** — after the diet ends, your suppressed metabolism causes rapid fat regain. This is why most diets fail long-term.

### The RECODE Nutrition Philosophy

RECODE approaches nutrition around four principles:

**1. Eat enough to support transformation**

Fat loss requires a calorie deficit, but a moderate one. Typically 300-500 calories below your maintenance level. Enough to lose fat, not enough to destroy metabolism or muscle.

**2. Prioritize protein**

Protein is the foundation of every RECODE nutrition plan. It:
- Preserves muscle during fat loss
- Increases satiety (you feel full longer)
- Has the highest thermic effect (burns more calories digesting)
- Supports recovery and repair

Target: 1.6-2.2g per kg of bodyweight daily.

**3. Build structure, not restriction**

Rigid food rules create a combative relationship with food. RECODE builds a flexible structure — target macros and food categories — that allows for real life while progressing toward goals.

**4. Adjust, don't crash**

As fat loss progresses, calories need adjusting. RECODE monitors progress biweekly and makes small, strategic adjustments rather than dramatic cuts.

### Practical Nutrition Habits

- Eat protein at every meal
- Prioritize whole foods 80% of the time
- Drink 2.5-3L water daily
- Don't skip breakfast — it sets your hunger regulation for the day
- Allow planned flexibility (meals out, social events) without guilt

### The Result

Sustainable fat loss. Preserved muscle. Better energy. A healthy relationship with food.

Not a temporary transformation — a permanent one.
    `,
    },
    {
        id: 3,
        slug: "mobility-the-forgotten-component",
        title: "Mobility: The Forgotten Component That Unlocks Everything",
        excerpt:
            "If you can't squat without your heels lifting, press overhead without pain, or sit on the floor comfortably — mobility training is non-negotiable.",
        category: "Mobility",
        readTime: "5 min read",
        date: "Jan 25, 2025",
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=340&fit=crop&q=80",
        content: `
## Mobility: The Forgotten Component That Unlocks Everything

If you can't squat without your heels lifting, press overhead without pain, or sit comfortably on the floor — mobility training is non-negotiable.

### What Is Mobility?

Mobility is active control through a joint's range of motion. It's different from flexibility (passive range) because mobility requires strength and control.

Good mobility means:
- Moving freely without compensation
- Loading joints safely through full range
- Reducing injury risk
- Improving performance in every movement

### Why Most People Are Immobile

Modern life creates predictable mobility restrictions:

**Hip flexors** — tight from sitting 8-10 hours daily. This pulls the pelvis forward, creates lower back pain, and limits squat depth.

**Thoracic spine** — stiff from desk posture. This forces the lower back and neck to compensate, creating pain and limiting overhead movements.

**Ankle dorsiflexion** — restricted from years of poor footwear and limited movement. This causes heel rise in squats and compensatory knee valgus.

**Shoulder internal/external rotation** — tight from chest-dominant training and poor posture. This creates impingement in pressing and pulling movements.

### The RECODE Mobility Protocol

In RECODE™, mobility is integrated into the RESTRUCTURE phase. The approach:

**Daily movement prep (10-15 minutes)**
Before any training session, a targeted mobility sequence addresses the key restrictions above. This isn't static stretching — it's active, controlled movement that builds range and control simultaneously.

**Training through full range**
Every exercise is performed through complete range of motion. This builds mobility while building strength — the most efficient approach.

**Corrective work for individual restrictions**
Each client is assessed for their specific mobility limitations and given targeted drills to address them.

### Simple Daily Mobility Routine

1. **90/90 hip stretch** — 60 seconds each side
2. **Thoracic rotation** — 10 reps each side
3. **Ankle circles and dorsiflexion work** — 60 seconds each
4. **Cat-cow** — 10 slow reps
5. **Deep squat hold** — 60 seconds

Perform this daily. Results appear within 2-4 weeks.

### Why Mobility Unlocks Everything

Better mobility means:
- Safer, more effective training
- Less pain and injury
- Better posture and appearance
- Improved athletic performance
- Higher quality of daily movement

Don't train around restrictions. Eliminate them.
    `,
    },
    {
        id: 4,
        slug: "building-muscle-the-smart-way",
        title: "Building Muscle the Smart Way: The RECODE Approach to Hypertrophy",
        excerpt:
            "More volume isn't always better. More intensity isn't always better. Here's what the science actually says about building muscle efficiently.",
        category: "Muscle Building",
        readTime: "7 min read",
        date: "Feb 3, 2025",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=340&fit=crop&q=80",
        content: `
## Building Muscle the Smart Way: The RECODE Approach to Hypertrophy

More volume isn't always better. More intensity isn't always better.

Here's what the science actually says about building muscle efficiently.

### The Three Mechanisms of Hypertrophy

Muscle growth occurs through three primary mechanisms:

**1. Mechanical tension** — the force applied to muscle fibers during contraction. This is the most important driver of hypertrophy. It's created by lifting heavy with full range of motion.

**2. Metabolic stress** — the accumulation of metabolites (lactate, hydrogen ions) during training. The "pump" is a signal of this. It contributes to hypertrophy but is secondary to tension.

**3. Muscle damage** — microtrauma to muscle fibers that triggers repair and growth. Novelty, eccentric loading, and range of motion drive this.

Effective training programs address all three.

### Progressive Overload: The Non-Negotiable

The single most important principle in muscle building is progressive overload — consistently increasing the demands on your muscles over time.

This can be achieved by:
- Adding weight to the bar
- Adding reps with the same weight
- Adding sets
- Reducing rest periods
- Improving range of motion
- Slowing the eccentric (lowering) phase

Without progressive overload, you maintain muscle. You don't build it.

### Volume and Frequency

Research suggests:
- **Minimum effective volume**: ~10 sets per muscle group per week
- **Optimal volume**: 15-20 sets per muscle group per week for most
- **Frequency**: Each muscle group should be trained 2x per week minimum

More volume only benefits you if you can recover from it. This is why recovery is the first RECODE pillar.

### The RECODE REBUILD Phase

When clients enter the REBUILD phase of RECODE™:

1. Mobility and movement quality are already established (RESTRUCTURE phase)
2. Recovery capacity is optimized (RECOVER phase)
3. Nutrition supports muscle gain (REGULATE phase)

This creates the foundation for efficient, injury-free muscle building.

Programs are periodized — volume and intensity change strategically over time to drive continuous adaptation.

### The Overlooked Muscle Building Factors

**Sleep** — growth hormone is released primarily during deep sleep. Poor sleep directly impairs muscle protein synthesis.

**Protein timing** — distribute protein intake across 4-5 meals of 30-50g each for optimal muscle protein synthesis stimulation.

**Mind-muscle connection** — consciously contracting the target muscle during exercise increases muscle activation and hypertrophy stimulus.

**Stress management** — chronically elevated cortisol is catabolic. It breaks down muscle. Stress management is part of training.

### The Result

Structured, progressive muscle building that compounds over months and years — not a 30-day challenge that fades.
    `,
    },
    {
        id: 5,
        slug: "sleep-your-secret-weapon",
        title: "Sleep: Your Most Powerful Transformation Tool",
        excerpt:
            "You can have the perfect training program and nutrition plan. If you're sleeping 5 hours a night, you're leaving 70% of your results on the table.",
        category: "Recovery",
        readTime: "5 min read",
        date: "Feb 12, 2025",
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=340&fit=crop&q=80",
        content: `
## Sleep: Your Most Powerful Transformation Tool

You can have the perfect training program and nutrition plan.

If you're sleeping 5 hours a night, you're leaving 70% of your results on the table.

### What Happens When You Sleep

Sleep is not passive recovery. It's an active biological process:

**Growth hormone release** — 70-80% of daily growth hormone secretion occurs during slow-wave sleep. This drives fat metabolism and muscle protein synthesis.

**Cortisol regulation** — sleep normalizes cortisol patterns. Poor sleep chronically elevates cortisol, promoting fat storage (especially visceral fat) and muscle breakdown.

**Leptin and ghrelin regulation** — sleep controls hunger hormones. One night of poor sleep increases ghrelin (hunger hormone) by 28% and decreases leptin (satiety hormone) by 18%. This is why you crave calorie-dense food after poor sleep.

**Memory consolidation** — motor patterns learned in training are consolidated during sleep. Better sleep literally makes you learn movement faster.

**Immune function** — recovery from training requires immune function. Poor sleep suppresses immunity and slows recovery.

### The Research Is Clear

Studies consistently show:
- Subjects sleeping 5.5 hours lost 55% less fat and 60% more muscle compared to those sleeping 8.5 hours on identical calorie deficits
- One night of partial sleep deprivation reduces insulin sensitivity by 25%
- Athletes sleeping 10 hours showed improved reaction time, sprint speed, and mood compared to their 7-hour baseline

### Sleep Quality vs. Sleep Quantity

Hours matter, but quality matters equally. Poor quality sleep (frequent waking, light sleep stages) reduces the hormonal and recovery benefits even with adequate duration.

Factors that destroy sleep quality:
- Blue light exposure before bed (screens)
- Irregular sleep schedule
- Caffeine after 2pm
- Alcohol (disrupts REM sleep)
- High stress/overthinking
- Hot sleeping environment

### Building a Sleep Protocol

**Consistency first** — same bedtime and wake time 7 days a week. This is the most impactful single change.

**Temperature** — cool room (18-20°C) promotes deeper sleep.

**Darkness** — blackout curtains or sleep mask. Even small amounts of light disrupt melatonin production.

**Wind-down routine** — 30-60 minutes of low stimulation before bed. Reading, stretching, journaling. No screens.

**Limit caffeine** — half-life of caffeine is 5-7 hours. Coffee at 3pm still affects you at 10pm.

**Limit alcohol** — alcohol may help you fall asleep but destroys sleep architecture. Avoid within 3 hours of bed.

### The Bottom Line

Sleep is the single most cost-effective performance and body composition tool available. It's free. It's powerful. And most people ignore it.

In RECODE™, sleep optimization is the first intervention. Everything builds from here.
    `,
    },
    {
        id: 6,
        slug: "mindset-for-sustainable-transformation",
        title: "The Mindset Shift That Makes Transformation Sustainable",
        excerpt:
            "The difference between people who transform permanently and those who yo-yo forever isn't discipline. It's identity.",
        category: "Mindset",
        readTime: "6 min read",
        date: "Feb 20, 2025",
        image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=600&h=340&fit=crop&q=80",
        content: `
## The Mindset Shift That Makes Transformation Sustainable

The difference between people who transform permanently and those who yo-yo forever isn't discipline.

It's identity.

### The Discipline Trap

Most people approach transformation with discipline as the goal. "I need to be more disciplined." "I just need to stick to it."

The problem: discipline is finite. It depletes. And it relies on constant motivation to function.

When motivation runs out — after a hard week, during a stressful period, after missing a few days — discipline collapses. And the whole system falls apart.

### Identity-Based Change

The permanent solution isn't more discipline. It's changing your identity.

When someone identifies as "a person who trains" rather than "someone trying to lose weight," their decisions change automatically. They don't deliberate over whether to work out. It's just what they do.

This is the core of RECODE's REDEFINE phase — the fifth and final pillar.

### How to Build a New Identity

**1. Vote for who you want to become**

Every action is a vote for your identity. Each workout, each nutritious meal, each good night of sleep is a vote for your health-focused identity.

You don't need a perfect record. You need enough votes. 70% consistency compounds into transformation.

**2. Change your environment**

Your environment shapes your behavior more than your willpower. Set up your space to make healthy choices easy and unhealthy choices hard.

Training gear visible. Healthy food at eye level in the fridge. Phone out of the bedroom. Walking shoes by the door.

**3. Join a community**

Identity is social. We become who we're surrounded by. Being around people who prioritize health and fitness accelerates identity formation.

This is why RECODE includes community access at every level.

**4. Celebrate process, not outcomes**

Outcome goals (lose 10kg) create a destination that ends. Process goals (train 4x weekly, hit protein daily) create a permanent lifestyle.

Celebrate showing up. Celebrate consistency. The outcomes follow.

**5. Reframe setbacks**

Perfectionists fail because they expect perfection. Permanent transformers expect imperfection and have a plan for it.

Missing a workout isn't failure. It's normal. What matters is the response — getting back to the process immediately, without guilt.

### The RECODE REDEFINE Philosophy

REDEFINE isn't the end of RECODE. It's the phase where coaching becomes unnecessary because the identity and systems are in place.

The goal of RECODE is not to create dependence on a coach. The goal is to create a version of you that doesn't need a coach — because you've internalized the principles and built the identity.

### The Bottom Line

Sustainable transformation is an identity shift, not a willpower battle. Build the identity. Build the systems. The results are inevitable.
    `,
    },
];

// ─── WHO IS RECODE FOR ────────────────────────────────────────────────────────
export const targetAudience = [
    "Busy Professionals",
    "Entrepreneurs",
    "Corporate Executives",
    "Creators & Influencers",
    "Students",
    "Beginners Starting Their Fitness Journey",
    "Anyone Seeking Sustainable Transformation",
];

// ─── WHY RECODE ───────────────────────────────────────────────────────────────
export const whyRecode = {
    others: [
        "Restrictive diets",
        "Endless cardio",
        "Short-term challenges",
        "Quick fixes",
    ],
    recode: [
        "Recovery",
        "Structure",
        "Movement Quality",
        "Nutrition",
        "Lifestyle Systems",
        "Sustainable Results",
    ],
};