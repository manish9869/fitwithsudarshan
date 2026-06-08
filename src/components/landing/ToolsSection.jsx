import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Calculator, Scale, Droplets, Beef, Activity, Percent, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function BMICalculator() {
    const [height, setHeight] = useState(170)
    const [weight, setWeight] = useState(70)
    const bmi = weight / Math.pow(height / 100, 2)
    const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"
    const bmiColor = bmi < 18.5 ? "#60a5fa" : bmi < 25 ? "#e71763" : bmi < 30 ? "#facc15" : "#f87171"
    const progressPercent = Math.min((bmi / 40) * 100, 100)
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between mb-2"><Label>Height</Label><span className="font-mono" style={{ color: '#e71763' }}>{height} cm</span></div>
                    <Slider value={[height]} onValueChange={(v) => setHeight(v[0])} min={120} max={220} step={1} className="w-full" />
                </div>
                <div>
                    <div className="flex justify-between mb-2"><Label>Weight</Label><span className="font-mono" style={{ color: '#e71763' }}>{weight} kg</span></div>
                    <Slider value={[weight]} onValueChange={(v) => setWeight(v[0])} min={30} max={200} step={1} className="w-full" />
                </div>
            </div>
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm text-muted-foreground mb-2">Your BMI</p>
                <p className="text-5xl font-bold mb-2" style={{ color: bmiColor }}>{bmi.toFixed(1)}</p>
                <p className="text-lg font-medium" style={{ color: bmiColor }}>{bmiCategory}</p>
                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} style={{ background: bmiColor }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
                </div>
            </div>
        </div>
    )
}

function CalorieCalculator() {
    const [age, setAge] = useState(25)
    const [weight, setWeight] = useState(70)
    const [height, setHeight] = useState(170)
    const [gender, setGender] = useState("male")
    const [activity, setActivity] = useState("moderate")
    const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 }
    const bmr = gender === "male" ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161
    const tdee = bmr * activityMultipliers[activity]
    return (
        <div className="space-y-6">
            {/* FIX: gap-3 instead of gap-4 — tighter on small screens */}
            <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-2 block">Age</Label><Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="bg-muted/50" /></div>
                <div><Label className="mb-2 block">Gender</Label>
                    <Select value={gender} onValueChange={setGender}><SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
                </div>
                <div><Label className="mb-2 block">Weight (kg)</Label><Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="bg-muted/50" /></div>
                <div><Label className="mb-2 block">Height (cm)</Label><Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="bg-muted/50" /></div>
            </div>
            <div><Label className="mb-2 block">Activity Level</Label>
                <Select value={activity} onValueChange={setActivity}><SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="sedentary">Sedentary (office job)</SelectItem>
                        <SelectItem value="light">Light (1-2 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                        <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                        <SelectItem value="veryActive">Very Active (athlete)</SelectItem>
                    </SelectContent></Select>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-xl p-3 sm:p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs text-muted-foreground mb-1">Cut</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-400">{Math.round(tdee - 500)}</p>
                    <p className="text-xs text-muted-foreground">kcal/day</p>
                </div>
                <div className="rounded-xl p-3 sm:p-4 text-center" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.2)' }}>
                    <p className="text-xs text-muted-foreground mb-1">Maintain</p>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: '#e71763' }}>{Math.round(tdee)}</p>
                    <p className="text-xs text-muted-foreground">kcal/day</p>
                </div>
                <div className="rounded-xl p-3 sm:p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs text-muted-foreground mb-1">Bulk</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-400">{Math.round(tdee + 300)}</p>
                    <p className="text-xs text-muted-foreground">kcal/day</p>
                </div>
            </div>
        </div>
    )
}

function MacroCalculator() {
    const [calories, setCalories] = useState(2000)
    const [goal, setGoal] = useState("balanced")
    const macroRatios = { balanced: { protein: 30, carbs: 40, fat: 30 }, lowCarb: { protein: 35, carbs: 25, fat: 40 }, highProtein: { protein: 40, carbs: 35, fat: 25 }, keto: { protein: 25, carbs: 5, fat: 70 } }
    const ratios = macroRatios[goal]
    const protein = Math.round((calories * ratios.protein / 100) / 4)
    const carbs = Math.round((calories * ratios.carbs / 100) / 4)
    const fat = Math.round((calories * ratios.fat / 100) / 9)
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between mb-2"><Label>Daily Calories</Label><span className="font-mono" style={{ color: '#e71763' }}>{calories} kcal</span></div>
                <Slider value={[calories]} onValueChange={(v) => setCalories(v[0])} min={1200} max={4000} step={50} className="w-full" />
            </div>
            <div><Label className="mb-2 block">Diet Type</Label>
                <Select value={goal} onValueChange={setGoal}><SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="balanced">Balanced</SelectItem><SelectItem value="lowCarb">Low Carb</SelectItem><SelectItem value="highProtein">High Protein</SelectItem><SelectItem value="keto">Keto</SelectItem></SelectContent></Select>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[{ label: "Protein", value: `${protein}g`, pct: ratios.protein, color: "#f87171" }, { label: "Carbs", value: `${carbs}g`, pct: ratios.carbs, color: "#e71763" }, { label: "Fat", value: `${fat}g`, pct: ratios.fat, color: "#facc15" }].map(({ label, value, pct, color }) => (
                    <div key={label} className="rounded-xl p-3 sm:p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 relative">
                            <svg className="w-full h-full -rotate-90"><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted" /><circle cx="32" cy="32" r="28" stroke={color} strokeWidth="4" fill="none" strokeDasharray={`${pct * 1.76} 176`} /></svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold">{pct}%</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color }}>{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ProteinCalculator() {
    const [weight, setWeight] = useState(70)
    const [goal, setGoal] = useState("maintain")
    const multipliers = { sedentary: 0.8, maintain: 1.0, build: 1.6, athlete: 2.2 }
    const proteinNeeds = weight * multipliers[goal]
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between mb-2"><Label>Body Weight</Label><span className="font-mono" style={{ color: '#e71763' }}>{weight} kg</span></div>
                <Slider value={[weight]} onValueChange={(v) => setWeight(v[0])} min={40} max={150} step={1} className="w-full" />
            </div>
            <div><Label className="mb-2 block">Fitness Goal</Label>
                <Select value={goal} onValueChange={setGoal}><SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="sedentary">Sedentary Lifestyle</SelectItem><SelectItem value="maintain">Maintain Muscle</SelectItem><SelectItem value="build">Build Muscle</SelectItem><SelectItem value="athlete">Competitive Athlete</SelectItem></SelectContent></Select>
            </div>
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm text-muted-foreground mb-2">Daily Protein Intake</p>
                <p className="text-5xl font-bold mb-2" style={{ color: '#e71763' }}>{Math.round(proteinNeeds)}g</p>
                <p className="text-sm text-muted-foreground">({multipliers[goal]}g per kg of bodyweight)</p>
            </div>
        </div>
    )
}

function WaterCalculator() {
    const [weight, setWeight] = useState(70)
    const [activity, setActivity] = useState("moderate")
    const multipliers = { sedentary: 30, light: 35, moderate: 40, active: 45 }
    const waterNeeds = (weight * multipliers[activity]) / 1000
    const glasses = Math.round(waterNeeds * 1000 / 250)
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between mb-2"><Label>Body Weight</Label><span className="font-mono text-blue-400">{weight} kg</span></div>
                <Slider value={[weight]} onValueChange={(v) => setWeight(v[0])} min={40} max={150} step={1} className="w-full" />
            </div>
            <div><Label className="mb-2 block">Activity Level</Label>
                <Select value={activity} onValueChange={setActivity}><SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="sedentary">Sedentary</SelectItem><SelectItem value="light">Light Activity</SelectItem><SelectItem value="moderate">Moderate Activity</SelectItem><SelectItem value="active">Very Active</SelectItem></SelectContent></Select>
            </div>
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Droplets className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Daily Water Intake</p>
                <p className="text-5xl font-bold text-blue-400 mb-2">{waterNeeds.toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">Approximately {glasses} glasses (250ml each)</p>
            </div>
        </div>
    )
}

function BodyFatCalculator() {
    const [gender, setGender] = useState("male")
    const [waist, setWaist] = useState(85)
    const [neck, setNeck] = useState(38)
    const [height, setHeight] = useState(175)
    const [hip, setHip] = useState(95)
    let bodyFat = gender === "male"
        ? 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450
        : 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450
    bodyFat = Math.max(0, Math.min(bodyFat, 50))
    const getCategory = () => {
        if (gender === "male") { if (bodyFat < 6) return "Essential"; if (bodyFat < 14) return "Athletic"; if (bodyFat < 18) return "Fitness"; if (bodyFat < 25) return "Average"; return "Obese"; }
        else { if (bodyFat < 14) return "Essential"; if (bodyFat < 21) return "Athletic"; if (bodyFat < 25) return "Fitness"; if (bodyFat < 32) return "Average"; return "Obese"; }
    }
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-2 block">Gender</Label>
                    <Select value={gender} onValueChange={setGender}><SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
                </div>
                <div><Label className="mb-2 block">Height (cm)</Label><Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="bg-muted/50" /></div>
                <div><Label className="mb-2 block">Waist (cm)</Label><Input type="number" value={waist} onChange={(e) => setWaist(Number(e.target.value))} className="bg-muted/50" /></div>
                <div><Label className="mb-2 block">Neck (cm)</Label><Input type="number" value={neck} onChange={(e) => setNeck(Number(e.target.value))} className="bg-muted/50" /></div>
                {gender === "female" && <div className="col-span-2"><Label className="mb-2 block">Hip (cm)</Label><Input type="number" value={hip} onChange={(e) => setHip(Number(e.target.value))} className="bg-muted/50" /></div>}
            </div>
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Percent className="w-12 h-12 mx-auto mb-4" style={{ color: '#e71763' }} />
                <p className="text-sm text-muted-foreground mb-2">Estimated Body Fat</p>
                <p className="text-5xl font-bold mb-2" style={{ color: '#e71763' }}>{bodyFat.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Category: {getCategory()}</p>
            </div>
        </div>
    )
}

const calculators = [
    { id: "bmi", label: "BMI", icon: Scale },
    { id: "calories", label: "Calories", icon: Calculator },
    { id: "macros", label: "Macros", icon: Activity },
    { id: "protein", label: "Protein", icon: Beef },
    { id: "water", label: "Water", icon: Droplets },
    { id: "bodyfat", label: "Body Fat", icon: Percent },
]

export function ToolsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    return (
        // FIX: py-12 sm:py-20 md:py-24 — was flat py-24
        <section id="tools" className="relative py-12 sm:py-20 md:py-24 overflow-hidden">
            <div ref={ref} className="relative container mx-auto px-4">
                {/* FIX: mb-8 sm:mb-12 md:mb-16 — was flat mb-16 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-8 sm:mb-12 md:mb-16">
                    <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#e71763' }}>Fitness Tools</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 sm:mb-6">Smart <span style={{ color: '#e71763' }}>Calculators</span></h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">Use these interactive tools to calculate your BMI, daily calorie needs, macro requirements, and more.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-2xl mx-auto">
                    <Tabs defaultValue="bmi" className="w-full">
                        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full mb-6 sm:mb-8 p-1 h-auto" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {calculators.map((calc) => (
                                <TabsTrigger key={calc.id} value={calc.id} className="flex flex-col items-center gap-1 py-2.5 sm:py-3 data-[state=active]:text-white"
                                    style={{ '--active-bg': '#e71763' }}
                                >
                                    <calc.icon className="h-4 w-4" />
                                    <span className="text-xs">{calc.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {/* FIX: p-4 sm:p-6 md:p-8 — was flat p-6 md:p-8 */}
                        <div className="rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <TabsContent value="bmi" className="mt-0"><BMICalculator /></TabsContent>
                            <TabsContent value="calories" className="mt-0"><CalorieCalculator /></TabsContent>
                            <TabsContent value="macros" className="mt-0"><MacroCalculator /></TabsContent>
                            <TabsContent value="protein" className="mt-0"><ProteinCalculator /></TabsContent>
                            <TabsContent value="water" className="mt-0"><WaterCalculator /></TabsContent>
                            <TabsContent value="bodyfat" className="mt-0"><BodyFatCalculator /></TabsContent>
                        </div>
                    </Tabs>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }} className="text-center mt-8 sm:mt-12">
                    <p className="text-muted-foreground mb-4">Want a personalized plan based on your results?</p>
                    <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="text-white font-bold group" style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.35)' }}>
                            Get Your Custom Plan
                            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </a>
                </motion.div>
            </div>
        </section>
    )
}