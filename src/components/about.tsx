"use client"

export function About() {
    return (
        <div className="max-w-5xl mx-auto py-4 px-4">
            <div className="shadow-lg rounded-xl overflow-hidden bg-card border border-border">
                {/* Header */}
                <div className="home-hero-gradient p-4 md:p-5 text-white">
                    <h1 className="text-2xl font-bold mb-3">
                        <i className="fas fa-info-circle ms-2"></i>
                        عن التطبيق
                    </h1>
                    <p className="mb-0 opacity-90">
                        تطبيق طمأنينة - رفيقك في رحلة التقرب إلى الله
                    </p>
                </div>

                {/* Content */}
                <div className="p-4 md:p-5">
                    <div className="flex flex-col gap-4">
                        {/* من نحن */}
                        <div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold mb-3 text-gold-500">
                                    <i className="fas fa-heart ms-2"></i>
                                    من نحن
                                </h3>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    طمأنينة هو تطبيق إسلامي شامل يهدف إلى مساعدتك في المحافظة على أذكارك اليومية
                                    والتقرب إلى الله عز وجل. نسعى لتوفير تجربة سهلة وجميلة تجمع بين الأذكار،
                                    مواقيت الصلاة، والتقويم الإسلامي في مكان واحد.
                                </p>
                            </div>
                        </div>

                        {/* رؤيتنا */}
                        <div className="md:grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 h-full">
                                <div className="text-center mb-3">
                                    <i className="fas fa-eye text-4xl gradient-text"></i>
                                </div>
                                <h4 className="text-base font-bold text-center mb-3">رؤيتنا</h4>
                                <p className="text-muted-foreground text-center mb-0">
                                    أن نكون المرجع الأول للمسلمين في متابعة عباداتهم اليومية
                                    وتسهيل طريقهم نحو الطاعة والذكر.
                                </p>
                            </div>

                        {/* مهمتنا */}
                        <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 h-full">
                                <div className="text-center mb-3">
                                    <i className="fas fa-bullseye text-4xl gradient-text"></i>
                                </div>
                                <h4 className="text-base font-bold text-center mb-3">مهمتنا</h4>
                                <p className="text-muted-foreground text-center mb-0">
                                    تقديم أدوات عملية وسهلة الاستخدام تساعد المسلم على الالتزام
                                    بأذكاره وعباداته في كل وقت ومكان.
                                </p>
                            </div>
                        </div>

                        {/* مميزات التطبيق */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 mt-3 text-gold-500">
                                <i className="fas fa-star ms-2"></i>
                                مميزات التطبيق
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-start">
                                    <i className="fas fa-check-circle text-xl ms-3 mt-1 shrink-0 text-sage-500 dark:text-sage-400"></i>
                                    <div>
                                        <h5 className="text-sm font-bold mb-1">أذكار الصباح والمساء</h5>
                                        <p className="text-muted-foreground text-sm mb-0">أذكار مصنفة ومنظمة مع عداد تلقائي</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <i className="fas fa-check-circle text-xl ms-3 mt-1 shrink-0 text-sage-500 dark:text-sage-400"></i>
                                    <div>
                                        <h5 className="text-sm font-bold mb-1">مواقيت الصلاة</h5>
                                        <p className="text-muted-foreground text-sm mb-0">مواعيد دقيقة حسب موقعك</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <i className="fas fa-check-circle text-xl ms-3 mt-1 shrink-0 text-sage-500 dark:text-sage-400"></i>
                                    <div>
                                        <h5 className="text-sm font-bold mb-1">التقويم الإسلامي</h5>
                                        <p className="text-muted-foreground text-sm mb-0">عرض متزامن للهجري والميلادي</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <i className="fas fa-check-circle text-xl ms-3 mt-1 shrink-0 text-sage-500 dark:text-sage-400"></i>
                                    <div>
                                        <h5 className="text-sm font-bold mb-1">عداد التسبيح</h5>
                                        <p className="text-muted-foreground text-sm mb-0">سبحة رقمية لتسهيل الذكر</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* تواصل معنا */}
                        <div>
                            <div className="text-center p-4 md:p-5 rounded-xl" style={{ background: "var(--primary-gradient)" }}>
                                <i className="fas fa-hands-praying text-4xl text-white mb-3"></i>
                                <h4 className="text-base font-bold text-white mb-2">دعواتكم</h4>
                                <p className="text-white mb-0 opacity-90">
                                    نسأل الله أن يتقبل منا ومنكم صالح الأعمال، وأن يجعل هذا العمل في ميزان حسناتنا
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
