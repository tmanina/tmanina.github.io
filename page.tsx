import { Header } from '@/components/header'
import { FloatingChat } from '@/components/floating-chat'
import { DhikrCounter } from '@/components/dhikr-counter'
import { MorningEvening } from '@/components/morning-evening'
import { IslamicCalendar } from '@/components/islamic-calendar'
import { Dashboard } from '@/components/dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Home() {
  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto mb-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-1">
            <TabsTrigger value="home" className="flex-1 rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white">
              <i className="fas fa-home ml-2"></i>الرئيسية
            </TabsTrigger>
            <TabsTrigger value="adhkar" className="flex-1 rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white">
              <i className="fas fa-pray ml-2"></i>الأذكار
            </TabsTrigger>
            <TabsTrigger value="morning-evening" className="flex-1 rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white">
              <i className="fas fa-sun ml-2"></i>الصباح والمساء
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white">
              <i className="fas fa-calendar ml-2"></i>التقويم
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex-1 rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white">
              <i className="fas fa-chart-line ml-2"></i>لوحة التحكم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <div className="space-y-6">
              <Card className="border-0 shadow-sm rounded-2xl card-hover">
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold text-teal-600 mb-2">مرحباً بك في طمانينة</h1>
                  <p className="text-muted-foreground">تطبيقك الشامل للأذكار والتقويم الإسلامي</p>
                </CardContent>
              </Card>
              
              <Dashboard compact />
            </div>
          </TabsContent>

          <TabsContent value="adhkar">
            <DhikrCounter />
          </TabsContent>

          <TabsContent value="morning-evening">
            <MorningEvening />
          </TabsContent>

          <TabsContent value="calendar">
            <IslamicCalendar />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </main>

      <FloatingChat />
    </div>
  )
}