"use client"

import * as React from "react"
import "./sahaba-player.css";

interface Sahaba {
    id: number
    name: string
    url: string
}

interface SahabaPlayerProps {
    onBack?: () => void
}

export function SahabaPlayer({ onBack }: SahabaPlayerProps) {
    const [playingSahaba, setPlayingSahaba] = React.useState<Sahaba | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [volume, setVolume] = React.useState(0.7)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const [playbackRate, setPlaybackRate] = React.useState(1)
    const [favorites, setFavorites] = React.useState<number[]>([])
    const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false)
    const [showSpeedDropdown, setShowSpeedDropdown] = React.useState(false)
    const [showTimerDropdown, setShowTimerDropdown] = React.useState(false)
    const [sleepTimer, setSleepTimer] = React.useState<number | null>(null)
    const [timerEndTime, setTimerEndTime] = React.useState<number | null>(null)

    const audioRef = React.useRef<HTMLAudioElement>(null)

    // List of Sahaba stories
    const sahabaList: Sahaba[] = [
        { id: 1, name: "الصحابي مصعب بن عمير", url: "https://list.qurango.net/sahabah/mosab.mp3" },
        { id: 2, name: "الصحابي عبدالله بن عتيك", url: "https://list.qurango.net/sahabah/abdullah-bin-ateek.mp3" },
        { id: 3, name: "خليفة رسول الله عليه السلام أبو بكر الصديق", url: "https://list.qurango.net/sahabah/Abu-Baker.mp3" },
        { id: 4, name: "أمير المؤمنين عمر بن الخطاب", url: "https://list.qurango.net/sahabah/omar.mp3" },
        { id: 5, name: "التابعي عطاء بن أبي رباح", url: "https://list.qurango.net/sahabah/ata.mp3" },
        { id: 6, name: "التابعي عامر بن عبدالله التميمي", url: "https://list.qurango.net/sahabah/amer-tamimi.mp3" },
        { id: 7, name: "التابعي عروة بن الزبير", url: "https://list.qurango.net/sahabah/auroh-zbir.mp3" },
        { id: 8, name: "التابعي الربيع بن خثيم", url: "https://list.qurango.net/sahabah/arabi-katham.mp3" },
        { id: 9, name: "الصحابي أنس بن مالك الأنصاري", url: "https://list.qurango.net/sahabah/anas-malik.mp3" },
        { id: 10, name: "الصحابي عبدالله بن جحش", url: "https://list.qurango.net/sahabah/abdullah-bin-gahsh.mp3" },
        { id: 11, name: "الصحابي العلاء بن الحضرمي - الجزء الأول", url: "https://list.qurango.net/sahabah/alala-hadrami-1.mp3" },
        { id: 12, name: "الصحابي العلاء بن الحضرمي - الجزء الثاني", url: "https://list.qurango.net/sahabah/alala-hadrami-2.mp3" },
        { id: 13, name: "الصحابي العلاء بن الحضرمي - الجزء الثالث", url: "https://list.qurango.net/sahabah/alala-hadrami-3.mp3" },
        { id: 14, name: "الصحابي المغيرة بن شعبة", url: "https://list.qurango.net/sahabah/almugerh.mp3" },
        { id: 15, name: "الصحابي معاذ بن عمرو بن الجموح وأخوه معوّذ", url: "https://list.qurango.net/sahabah/muath-gamoh-b.mp3" },
        { id: 16, name: "الصحابي المقداد بن عمرو", url: "https://list.qurango.net/sahabah/mqdad.mp3" },
        { id: 17, name: "الصحابي عمرو بن أمية الضمري", url: "https://list.qurango.net/sahabah/amru-aomih.mp3" },
        { id: 18, name: "الصحابي أبو عبيدة بن الجراح", url: "https://list.qurango.net/sahabah/abu-aobidah.mp3" },
        { id: 19, name: "الصحابي عبدالله بن مسعود", url: "https://list.qurango.net/sahabah/abdullah-masaud.mp3" },
        { id: 20, name: "الصحابي سلمان الفارسي", url: "https://list.qurango.net/sahabah/salman-farisi.mp3" },
        { id: 21, name: "الصحابي عكرمة بن أبي جهل", url: "https://list.qurango.net/sahabah/ekremah.mp3" },
        { id: 22, name: "الصحابي زيد الخير", url: "https://list.qurango.net/sahabah/zid.mp3" },
        { id: 23, name: "الصحابي عدي بن حاتم الطائي", url: "https://list.qurango.net/sahabah/auday-taei.mp3" },
        { id: 24, name: "الصحابي أبو ذر الغفاري", url: "https://list.qurango.net/sahabah/abu-thar.mp3" },
        { id: 25, name: "الصحابي عبدالله بن أم مكتوم", url: "https://list.qurango.net/sahabah/abdullah-maktom.mp3" },
        { id: 26, name: "الصحابي مجزأة بن ثور السدوسي", url: "https://list.qurango.net/sahabah/mujzah.mp3" },
        { id: 27, name: "الصحابي سعيد بن عامر الجمحي", url: "https://list.qurango.net/sahabah/saed-jmahe.mp3" },
        { id: 28, name: "الصحابي أسيد بن الحضير", url: "https://list.qurango.net/sahabah/ausaid.mp3" },
        { id: 29, name: "الصحابي عبدالله بن عباس", url: "https://list.qurango.net/sahabah/abdullah-abas.mp3" },
        { id: 30, name: "الصحابي النعمان بن مقرن المزني", url: "https://list.qurango.net/sahabah/alnuaman.mp3" },
        { id: 31, name: "الصحابي صهيب الرومي", url: "https://list.qurango.net/sahabah/alromi.mp3" },
        { id: 32, name: "الصحابي أبو الدرداء", url: "https://list.qurango.net/sahabah/Abu-drda.mp3" },
        { id: 33, name: "الصحابي زيد بن حارثة", url: "https://list.qurango.net/sahabah/zaid-harithah.mp3" },
        { id: 34, name: "الصحابي أسامة بن زيد", url: "https://list.qurango.net/sahabah/osama-zid.mp3" },
        { id: 35, name: "الصحابي سعيد بن زيد", url: "https://list.qurango.net/sahabah/saead-zid.mp3" },
        { id: 36, name: "الصحابي عمير بن سعد في صغره", url: "https://list.qurango.net/sahabah/omair-saed.mp3" },
        { id: 37, name: "الصحابي عمير بن سعد في كبره", url: "https://list.qurango.net/sahabah/omair-saed-2.mp3" },
        { id: 38, name: "الصحابي الطفيل بن عمرو الدوسي", url: "https://list.qurango.net/sahabah/tofail.mp3" },
        { id: 39, name: "الصحابي عبدالرحمن بن عوف", url: "https://list.qurango.net/sahabah/Bin-aouf.mp3" },
        { id: 40, name: "الصحابي جعفر بن أبي طالب", url: "https://list.qurango.net/sahabah/jafar-taleb.mp3" },
        { id: 41, name: "الصحابي أبو سفيان بن الحارث", url: "https://list.qurango.net/sahabah/abu-sofian-harith.mp3" },
        { id: 42, name: "الصحابي سعد بن أبي وقاص", url: "https://list.qurango.net/sahabah/saed-waqas.mp3" },
        { id: 43, name: "الصحابي حذيفة بن اليمان", url: "https://list.qurango.net/sahabah/huthaifa-yaman.mp3" },
        { id: 44, name: "الصحابي عقبة بن عامر الجهني", url: "https://list.qurango.net/sahabah/auqbah-jhani.mp3" },
        { id: 45, name: "الصحابي بلال بن رباح", url: "https://list.qurango.net/sahabah/bilal.mp3" },
        { id: 46, name: "الصحابي حبيب بن زيد الأنصاري", url: "https://list.qurango.net/sahabah/zid-ansari.mp3" },
        { id: 47, name: "الصحابي أبو طلحة الأنصاري", url: "https://list.qurango.net/sahabah/abu-talhah.mp3" },
        { id: 48, name: "الصحابي وحشي بن حرب", url: "https://list.qurango.net/sahabah/wahshy.mp3" },
        { id: 49, name: "الصحابي عبدالله بن حذافة السهمي", url: "https://list.qurango.net/sahabah/abdullah-sahme.mp3" },
        { id: 50, name: "الصحابي حكيم بن حزام", url: "https://list.qurango.net/sahabah/hakim.mp3" },
        { id: 51, name: "الصحابي عباد بن بشر", url: "https://list.qurango.net/sahabah/abad-bsher.mp3" },
        { id: 52, name: "الصحابي زيد بن ثابت الأنصاري", url: "https://list.qurango.net/sahabah/zid-thabit.mp3" },
        { id: 53, name: "الصحابي ربيعة بن كعب", url: "https://list.qurango.net/sahabah/rabiah-kab.mp3" },
        { id: 54, name: "الصحابي ذو البجادين", url: "https://list.qurango.net/sahabah/tho-bagadain.mp3" },
        { id: 55, name: "الصحابي أبو العاص بن الربيع", url: "https://list.qurango.net/sahabah/abu-alas-rabie.mp3" },
        { id: 56, name: "الصحابي عاصم بن ثابت", url: "https://list.qurango.net/sahabah/asem-thabit.mp3" },
        { id: 57, name: "الصحابي عتبة بن غزوان", url: "https://list.qurango.net/sahabah/autbah-gazwan.mp3" },
        { id: 58, name: "الصحابي نعيم بن مسعود", url: "https://list.qurango.net/sahabah/naem-masaud.mp3" },
        { id: 59, name: "الصحابي خباب بن الأرت", url: "https://list.qurango.net/sahabah/kabab-arat.mp3" },
        { id: 60, name: "الصحابي الربيع بن زياد الحارثي", url: "https://list.qurango.net/sahabah/alrabea-ziad.mp3" },
        { id: 61, name: "الصحابي عمير بن وهب", url: "https://list.qurango.net/sahabah/aumair-wahb.mp3" },
        { id: 62, name: "الصحابي عبدالله بن سلام", url: "https://list.qurango.net/sahabah/abdullah-salam.mp3" },
        { id: 63, name: "الصحابي خالد بن سعيد بن العاص", url: "https://list.qurango.net/sahabah/khaled-saed.mp3" },
        { id: 64, name: "الصحابي سراقة بن مالك", url: "https://list.qurango.net/sahabah/surqah-malik.mp3" },
        { id: 65, name: "الصحابي فيروز الديلمي", url: "https://list.qurango.net/sahabah/fayroz-delyme.mp3" },
        { id: 66, name: "الصحابي ثابت بن قيس الأنصاري", url: "https://list.qurango.net/sahabah/thabit-qys.mp3" },
        { id: 67, name: "الصحابي طلحة بن عبيدالله التيمي", url: "https://list.qurango.net/sahabah/talhah-abdullah.mp3" },
        { id: 68, name: "الصحابي أبو هريرة الدوسي", url: "https://list.qurango.net/sahabah/abu-horairah.mp3" },
        { id: 69, name: "الصحابي سلمة بن قيس الأشجعي", url: "https://list.qurango.net/sahabah/salamh-ays.mp3" },
        { id: 70, name: "الصحابي معاذ بن جبل", url: "https://list.qurango.net/sahabah/muoath-jabl.mp3" },
        { id: 71, name: "الصحابي البراء بن مالك الأنصاري", url: "https://list.qurango.net/sahabah/albara-malik.mp3" },
        { id: 72, name: "آل ياسر رضي الله عنهم", url: "https://list.qurango.net/sahabah/alyaser.mp3" },
        { id: 73, name: "الصحابي سهيل بن عمرو", url: "https://list.qurango.net/sahabah/suahil-amro.mp3" },
        { id: 74, name: "الصحابي جابر بن عبدالله الأنصاري", url: "https://list.qurango.net/sahabah/jaber-abullah.mp3" },
        { id: 75, name: "الصحابي سالم مولى أبي حذيفة", url: "https://list.qurango.net/sahabah/salem-mola.mp3" },
        { id: 76, name: "ذو النورين عثمان بن عفان", url: "https://list.qurango.net/sahabah/outhman-affan.mp3" },
        { id: 77, name: "الصحابي عمرو بن العاص", url: "https://list.qurango.net/sahabah/amro-alas.mp3" },
        { id: 78, name: "الصحابي أبو لبابة", url: "https://list.qurango.net/sahabah/abu-lobabah.mp3" },
        { id: 79, name: "الصحابي جرير بن عبدالله البجلي", url: "https://list.qurango.net/sahabah/jarir-abdullah.mp3" },
        { id: 80, name: "الصحابي أبي بن كعب الأنصاري", url: "https://list.qurango.net/sahabah/aby-kab.mp3" },
        { id: 81, name: "الصحابي ثمامة بن أثال", url: "https://list.qurango.net/sahabah/thomamah.mp3" },
        { id: 82, name: "الصحابي ميسرة بن مسروق العبسي", url: "https://list.qurango.net/sahabah/mysarah.mp3" },
        { id: 83, name: "الصحابي حمزة بن عبدالمطلب", url: "https://list.qurango.net/sahabah/hamzah-abdulmotaleb.mp3" },
        { id: 84, name: "الصحابي أبو عقيل الأنيقي", url: "https://list.qurango.net/sahabah/abu-aqel.mp3" },
        { id: 85, name: "الصحابي سعيد بن العاص", url: "https://list.qurango.net/sahabah/saed-alas.mp3" },
        { id: 86, name: "الصحابي جليبيب", url: "https://list.qurango.net/sahabah/jolebeb.mp3" },
        { id: 87, name: "الصحابي سعد بن معاذ", url: "https://list.qurango.net/sahabah/saed-mouath.mp3" },
        { id: 88, name: "الصحابي شداد بن أوس الأنصاري", url: "https://list.qurango.net/sahabah/shadad.mp3" },
        { id: 89, name: "الصحابي عبدالله بن الزبير", url: "https://list.qurango.net/sahabah/abdullah-zubair.mp3" },
        { id: 90, name: "الصحابي القعقاع بن عمرو", url: "https://list.qurango.net/sahabah/alqaqa.mp3" },
        { id: 91, name: "الصحابي أبو أيوب الأنصاري", url: "https://list.qurango.net/sahabah/abu-ayob.mp3" },
        { id: 92, name: "الصحابي أبو عبيد بن مسعود الثقفي", url: "https://list.qurango.net/sahabah/abu-aubaidah-masaud.mp3" },
        { id: 93, name: "الصحابي الزبير بن العوام", url: "https://list.qurango.net/sahabah/zubair-auoam.mp3" },
        { id: 94, name: "الصحابي سماك بن خرشة", url: "https://list.qurango.net/sahabah/samak.mp3" },
        { id: 95, name: "الصحابي خالد بن الوليد", url: "https://list.qurango.net/sahabah/khaled-alwaleed.mp3" },
        { id: 96, name: "الصحابي المثنى بن حارثة الشيباني", url: "https://list.qurango.net/sahabah/almothana.mp3" },
        { id: 97, name: "الصحابي سلمة بن الأكوع", url: "https://list.qurango.net/sahabah/salamah.mp3" },
        { id: 98, name: "الصحابي أبو بصير عتبة بن أسيد", url: "https://list.qurango.net/sahabah/abu-baser.mp3" },
        { id: 99, name: "الصحابي زيد بن سعنة", url: "https://list.qurango.net/sahabah/zaid-sanah.mp3" },
        { id: 100, name: "الصحابي عبدالله بن عمر بن الخطاب", url: "https://list.qurango.net/sahabah/abdullah-omar.mp3" },
        { id: 101, name: "الصحابي عمرو بن الجموح", url: "https://list.qurango.net/sahabah/amro-jamoh.mp3" },
        { id: 102, name: "الصحابي طليحة بن خويلد الأسدي", url: "https://list.qurango.net/sahabah/tolaiahh.mp3" },
        { id: 103, name: "الصحابي عبادة بن الصامت", url: "https://list.qurango.net/sahabah/aubadah.mp3" },
        { id: 104, name: "الصحابي يزيد بن أبي سفيان", url: "https://list.qurango.net/sahabah/yazed-sofian.mp3" },
        { id: 105, name: "الصحابي العباس بن عبدالمطلب", url: "https://list.qurango.net/sahabah/alabas.mp3" },
        { id: 106, name: "الصحابي أنس بن النضر النجاري", url: "https://list.qurango.net/sahabah/anas-alnjary.mp3" },
        { id: 107, name: "الصحابي رافع بن عمير الطائي", url: "https://list.qurango.net/sahabah/rafa-taei.mp3" },
        { id: 108, name: "الصحابي عثمان بن مظعون", url: "https://list.qurango.net/sahabah/outhman-mathon.mp3" },
        { id: 109, name: "الصحابي كعب بن مالك", url: "https://list.qurango.net/sahabah/kab-malik.mp3" },
        { id: 110, name: "الصحابي تميم الداري", url: "https://list.qurango.net/sahabah/tamim-dary.mp3" },
        { id: 111, name: "يوم الرجيع", url: "https://list.qurango.net/sahabah/yaom-arajea.mp3" },
        { id: 112, name: "الصحابية حليمة السعدية", url: "https://list.qurango.net/sahabah/halemah.mp3" },
        { id: 113, name: "الصحابية صفية بنت عبدالمطلب", url: "https://list.qurango.net/sahabah/safeah.mp3" },
        { id: 114, name: "الصحابية فاطمة الزهراء", url: "https://list.qurango.net/sahabah/fatemah.mp3" },
        { id: 115, name: "الصحابية أسماء بنت أبي بكر", url: "https://list.qurango.net/sahabah/asma.mp3" },
        { id: 116, name: "الصحابية نسيبة المازنية", url: "https://list.qurango.net/sahabah/nasebah.mp3" },
        { id: 117, name: "الصحابية رملة بنت أبي سفيان", url: "https://list.qurango.net/sahabah/ramlah.mp3" },
        { id: 118, name: "الصحابية الغميصاء بنت ملحان", url: "https://list.qurango.net/sahabah/goaysa.mp3" },
        { id: 119, name: "الصحابية أم سلمة", url: "https://list.qurango.net/sahabah/um-salamah.mp3" }
    ]

    // Load favorites from localStorage on mount
    React.useEffect(() => {
        const savedFavorites = localStorage.getItem('sahaba-favorites')
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites))
        }
    }, [])

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    // Setup Media Session API for background playback
    React.useEffect(() => {
        if ('mediaSession' in navigator && playingSahaba && isPlaying) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: playingSahaba.name,
                artist: 'حياه الصحابة',
                album: 'قصص الصحابة رضوان الله عليهم',
                artwork: [
                    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
                ]
            })

            navigator.mediaSession.playbackState = 'playing'

            navigator.mediaSession.setActionHandler('play', () => {
                if (audioRef.current) {
                    audioRef.current.play().catch(() => setIsPlaying(false))
                    setIsPlaying(true)
                }
            })

            navigator.mediaSession.setActionHandler('pause', () => {
                if (audioRef.current) {
                    audioRef.current.pause()
                    setIsPlaying(false)
                }
            })

            navigator.mediaSession.setActionHandler('stop', () => {
                stopAudio()
            })
        } else if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = playingSahaba ? 'paused' : 'none'
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
                navigator.mediaSession.setActionHandler('stop', null)
            }
        }
    }, [playingSahaba, isPlaying])

    // Keep audio playing in background - handle visibility change
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && playingSahaba && isPlaying) {
                if (audioRef.current && audioRef.current.paused) {
                    console.log('Resuming Sahaba audio after tab became visible')
                    audioRef.current.play().catch((err) => {
                        console.error('Failed to resume:', err)
                        if (audioRef.current && playingSahaba) {
                            const time = audioRef.current.currentTime
                            audioRef.current.src = playingSahaba.url
                            audioRef.current.currentTime = time
                            audioRef.current.play().catch(() => setIsPlaying(false))
                        }
                    })
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [playingSahaba, isPlaying])

    // Auto-reconnect on audio stall
    React.useEffect(() => {
        const audio = audioRef.current
        if (!audio || !playingSahaba) return

        let reconnectAttempts = 0

        const handleStalled = () => {
            console.log('Sahaba audio stalled')
            if (isPlaying && reconnectAttempts < 3) {
                reconnectAttempts++
                setTimeout(() => {
                    if (audio && playingSahaba) {
                        const time = audio.currentTime
                        audio.src = playingSahaba.url
                        audio.currentTime = time
                        audio.play().catch(console.error)
                    }
                }, 1000 * reconnectAttempts)
            }
        }

        const handlePlaying = () => {
            reconnectAttempts = 0
        }

        audio.addEventListener('stalled', handleStalled)
        audio.addEventListener('playing', handlePlaying)

        return () => {
            audio.removeEventListener('stalled', handleStalled)
            audio.removeEventListener('playing', handlePlaying)
        }
    }, [playingSahaba, isPlaying])

    // Keep-alive ping
    React.useEffect(() => {
        if (!playingSahaba || !isPlaying) return

        const keepAliveInterval = setInterval(() => {
            if (audioRef.current && isPlaying && audioRef.current.paused) {
                console.log('Sahaba keep-alive: Audio paused unexpectedly, resuming...')
                audioRef.current.play().catch(() => {
                    if (audioRef.current && playingSahaba) {
                        const time = audioRef.current.currentTime
                        audioRef.current.src = playingSahaba.url
                        audioRef.current.currentTime = time
                        audioRef.current.play().catch(() => setIsPlaying(false))
                    }
                })
            }
        }, 30000)

        return () => clearInterval(keepAliveInterval)
    }, [playingSahaba, isPlaying])

    const filteredSahaba = sahabaList.filter(sahaba => {
        const matchesSearch = sahaba.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFavorites = !showFavoritesOnly || favorites.includes(sahaba.id)
        return matchesSearch && matchesFavorites
    })

    // Toggle favorite
    const toggleFavorite = (sahabaId: number, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click
        const newFavorites = favorites.includes(sahabaId)
            ? favorites.filter(id => id !== sahabaId)
            : [...favorites, sahabaId]
        setFavorites(newFavorites)
        localStorage.setItem('sahaba-favorites', JSON.stringify(newFavorites))
    }

    const playAudio = (sahaba: Sahaba) => {
        if (playingSahaba?.id === sahaba.id) {
            togglePlayPause()
        } else {
            setPlayingSahaba(sahaba)
            setIsPlaying(true)
            if (audioRef.current) {
                audioRef.current.src = sahaba.url
                audioRef.current.play().catch(() => setIsPlaying(false))
            }
        }
    }

    const togglePlayPause = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play().catch(() => setIsPlaying(false))
            setIsPlaying(true)
        }
    }

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ""
        }
        setPlayingSahaba(null)
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
    }

    // Format time in MM:SS
    const formatTime = (seconds: number): string => {
        if (isNaN(seconds)) return "00:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Skip forward 10 seconds
    const skipForward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
        }
    }

    // Skip backward 10 seconds
    const skipBackward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
        }
    }

    // Play next story
    const playNext = () => {
        if (!playingSahaba) return
        const currentIndex = sahabaList.findIndex(s => s.id === playingSahaba.id)
        if (currentIndex < sahabaList.length - 1) {
            playAudio(sahabaList[currentIndex + 1])
        }
    }

    // Play previous story
    const playPrevious = () => {
        if (!playingSahaba) return
        const currentIndex = sahabaList.findIndex(s => s.id === playingSahaba.id)
        if (currentIndex > 0) {
            playAudio(sahabaList[currentIndex - 1])
        }
    }

    // Check if can go to next/previous
    const canGoNext = (): boolean => {
        if (!playingSahaba) return false
        const currentIndex = sahabaList.findIndex(s => s.id === playingSahaba.id)
        return currentIndex < sahabaList.length - 1
    }

    const canGoPrevious = (): boolean => {
        if (!playingSahaba) return false
        const currentIndex = sahabaList.findIndex(s => s.id === playingSahaba.id)
        return currentIndex > 0
    }

    // Change playback speed
    const selectPlaybackSpeed = (speed: number) => {
        setPlaybackRate(speed)
        if (audioRef.current) {
            audioRef.current.playbackRate = speed
        }
        setShowSpeedDropdown(false)
    }

    // Sleep timer functions
    const setSleepTimerMinutes = (minutes: number | null) => {
        if (minutes === null) {
            setSleepTimer(null)
            setTimerEndTime(null)
        } else {
            setSleepTimer(minutes)
            setTimerEndTime(Date.now() + minutes * 60 * 1000)
        }
        setShowTimerDropdown(false)
    }

    // Check timer expiration
    React.useEffect(() => {
        if (timerEndTime && Date.now() >= timerEndTime) {
            stopAudio()
            setSleepTimer(null)
            setTimerEndTime(null)
        }

        if (timerEndTime) {
            const interval = setInterval(() => {
                if (Date.now() >= timerEndTime) {
                    stopAudio()
                    setSleepTimer(null)
                    setTimerEndTime(null)
                }
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [timerEndTime])

    // Handle seeking
    const handleSeek = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!audioRef.current || duration === 0) return

        const bar = document.querySelector('.progress-bar-inner') as HTMLElement
        if (!bar) return

        const rect = bar.getBoundingClientRect()
        let clientX

        if ('touches' in e) {
            clientX = e.touches[0].clientX
        } else {
            clientX = (e as MouseEvent).clientX
        }

        // For RTL: calculate from right side
        const clickX = rect.right - clientX
        const percentage = Math.max(0, Math.min(1, clickX / rect.width))
        const newTime = percentage * duration

        setCurrentTime(newTime)

        // Only update audio time if not dragging (or on drag end)
        if (!isDragging) {
            audioRef.current.currentTime = newTime
        }
    }

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true)
        handleSeek(e)
    }

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDragging) {
            handleSeek(e)
        }
    }

    const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDragging) {
            setIsDragging(false)
            if (audioRef.current) {
                audioRef.current.currentTime = currentTime
            }
        }
    }

    // Add global event listeners for drag end/move
    React.useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                handleSeek(e)
            }
        }

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                setIsDragging(false)
                if (audioRef.current) {
                    audioRef.current.currentTime = currentTime
                }
            }
        }

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                handleSeek(e)
            }
        }

        const handleGlobalTouchEnd = (e: TouchEvent) => {
            if (isDragging) {
                setIsDragging(false)
                if (audioRef.current) {
                    audioRef.current.currentTime = currentTime
                }
            }
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove)
            document.addEventListener('mouseup', handleGlobalMouseUp)
            document.addEventListener('touchmove', handleGlobalTouchMove)
            document.addEventListener('touchend', handleGlobalTouchEnd)
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove)
            document.removeEventListener('mouseup', handleGlobalMouseUp)
            document.removeEventListener('touchmove', handleGlobalTouchMove)
            document.removeEventListener('touchend', handleGlobalTouchEnd)
        }
    }, [isDragging, currentTime, duration])

    return (
        <div className="sahaba-player">
            {/* Header */}
            <div className="sahaba-header">
                <div className="sahaba-header-content">
                    <div>
                        <h2 className="sahaba-title">
                            <i className="fas fa-users"></i>
                            حياه الصحابة
                        </h2>
                        <p className="sahaba-subtitle">قصص ومواقف من حياة الصحابة رضوان الله عليهم</p>
                    </div>
                    <button
                        className={`favorites-toggle-btn ${showFavoritesOnly ? 'active' : ''}`}
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        type="button"
                    >
                        <i className={showFavoritesOnly ? "fas fa-heart" : "far fa-heart"}></i>
                        المفضلة
                        {favorites.length > 0 && (
                            <span className="favorites-count">{favorites.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Box */}
            <div className="search-box">
                <input
                    type="text"
                    className="search-input"
                    placeholder="ابحث عن صحابي..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Sahaba Grid */}
            <div className="sahaba-grid">
                {filteredSahaba.map((sahaba) => (
                    <div
                        key={sahaba.id}
                        className={`sahaba-card ${playingSahaba?.id === sahaba.id ? 'playing' : ''}`}
                        onClick={() => playAudio(sahaba)}
                    >
                        <div className="sahaba-card-header">
                            <div className="sahaba-icon">
                                <i className="fas fa-user"></i>
                            </div>
                            <div className="sahaba-name-wrapper">
                                <h3 className="sahaba-name">{sahaba.name}</h3>
                                <button
                                    className={`favorite-btn ${favorites.includes(sahaba.id) ? 'active' : ''}`}
                                    onClick={(e) => toggleFavorite(sahaba.id, e)}
                                    type="button"
                                    aria-label="إضافة إلى المفضلة"
                                >
                                    <i className={favorites.includes(sahaba.id) ? "fas fa-heart" : "far fa-heart"}></i>
                                </button>
                            </div>
                        </div>
                        <div className="sahaba-actions">
                            <button className="sahaba-btn play-btn" type="button">
                                <i className={`fas ${playingSahaba?.id === sahaba.id && isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                                {playingSahaba?.id === sahaba.id && isPlaying ? 'إيقاف مؤقت' : 'استماع'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Player Bar */}
            {playingSahaba && (
                <div className="player-bar">
                    <div className="player-content">
                        {/* Track Info */}
                        <div className="track-info">
                            <div className="track-details">
                                <h3 className="track-name">{playingSahaba.name}</h3>
                                <button
                                    className={`action-btn heart-btn ${favorites.includes(playingSahaba.id) ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleFavorite(playingSahaba.id, e)
                                    }}
                                    aria-label="إضافة إلى المفضلة"
                                >
                                    <i className={favorites.includes(playingSahaba.id) ? "fas fa-heart" : "far fa-heart"}></i>
                                </button>
                            </div>
                        </div>

                        {/* Progress & Controls Wrapper */}
                        <div className="controls-wrapper">
                            {/* Progress Bar */}
                            <div className="progress-section">
                                <span className="time-text">{formatTime(currentTime)}</span>
                                <div
                                    className="progress-bar"
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                    onClick={handleSeek}
                                >
                                    <div className="progress-bar-inner">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="time-text">{formatTime(duration)}</span>
                            </div>

                            {/* Main Controls */}
                            <div className="main-controls">
                                {/* Timer Dropdown */}
                                <div className="timer-dropdown-wrapper">
                                    <button
                                        className={`action-btn secondary-btn ${sleepTimer ? 'timer-active' : ''}`}
                                        onClick={() => setShowTimerDropdown(!showTimerDropdown)}
                                        aria-label="المُؤقت"
                                    >
                                        <i className="far fa-clock"></i>
                                    </button>
                                    {showTimerDropdown && (
                                        <div className="timer-dropdown">
                                            <div className="timer-dropdown-header">المُؤقت</div>
                                            <button
                                                className={`timer-option ${sleepTimer === null ? 'active' : ''}`}
                                                onClick={() => setSleepTimerMinutes(null)}
                                                type="button"
                                            >
                                                00:00
                                                {sleepTimer === null && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`timer-option ${sleepTimer === 15 ? 'active' : ''}`}
                                                onClick={() => setSleepTimerMinutes(15)}
                                                type="button"
                                            >
                                                15 دقيقة
                                                {sleepTimer === 15 && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`timer-option ${sleepTimer === 30 ? 'active' : ''}`}
                                                onClick={() => setSleepTimerMinutes(30)}
                                                type="button"
                                            >
                                                30 دقيقة
                                                {sleepTimer === 30 && <i className="fas fa-check"></i>}
                                            </button>
                                            <button
                                                className={`timer-option ${sleepTimer === 60 ? 'active' : ''}`}
                                                onClick={() => setSleepTimerMinutes(60)}
                                                type="button"
                                            >
                                                60 دقيقة
                                                {sleepTimer === 60 && <i className="fas fa-check"></i>}
                                            </button>
                                            {sleepTimer !== null && (
                                                <button
                                                    className="timer-option cancel-timer"
                                                    onClick={() => setSleepTimerMinutes(null)}
                                                    type="button"
                                                >
                                                    <i className="fas fa-times"></i>
                                                    إلغاء المُؤقت
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Skip Backward */}
                                <button className="action-btn secondary-btn" onClick={skipBackward} aria-label="ترجيع 10 ثواني">
                                    <i className="fas fa-undo-alt"></i>
                                    <span className="tiny-text">10</span>
                                </button>

                                {/* Previous */}
                                <button
                                    className="action-btn secondary-btn"
                                    onClick={playPrevious}
                                    disabled={!canGoPrevious()}
                                    aria-label="السابق"
                                >
                                    <i className="fas fa-step-forward fa-rotate-180"></i>
                                </button>

                                {/* Play/Pause */}
                                <button className="play-pause-btn" onClick={togglePlayPause}>
                                    {isPlaying ? (
                                        <i className="fas fa-pause"></i>
                                    ) : (
                                        <i className="fas fa-play"></i>
                                    )}
                                </button>

                                {/* Next */}
                                <button
                                    className="action-btn secondary-btn"
                                    onClick={playNext}
                                    disabled={!canGoNext()}
                                    aria-label="التالي"
                                >
                                    <i className="fas fa-step-backward fa-rotate-180"></i>
                                </button>

                                {/* Skip Forward */}
                                <button className="action-btn secondary-btn" onClick={skipForward} aria-label="تقديم 10 ثواني">
                                    <i className="fas fa-redo-alt"></i>
                                    <span className="tiny-text">10</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio Element */}
            <audio
                ref={audioRef}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => {
                    if (!isDragging) {
                        setCurrentTime(e.currentTarget.currentTime)
                    }
                }}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
        </div>
    )
}

export default SahabaPlayer

