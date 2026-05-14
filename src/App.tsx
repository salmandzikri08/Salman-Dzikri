import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  MessageCircle, 
  Store, 
  Search, 
  ArrowRight, 
  ShoppingCart, 
  User, 
  LogIn, 
  LogOut,
  Send,
  Sparkles,
  Info,
  ChevronRight,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, ConsultationMessage, JamuItem, OperationType, FirestoreErrorInfo } from './types';
import { getHerbalConsultation } from './services/geminiService';

const JAMU_CATALOG: JamuItem[] = [
  {
    id: '1',
    name: 'Beras Kencur',
    benefits: ['Meningkatkan nafsu makan', 'Menghilangkan pegal-pegal', 'Meredakan batuk'],
    ingredients: ['Beras', 'Kencur', 'Jahe', 'Gula Jawa'],
    description: 'Jamu yang paling populer untuk memulihkan stamina dan menyegarkan tubuh setelah bekerja keras.',
    image: 'https://images.unsplash.com/photo-1582760855219-fc4bf16ae76a?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=beras%20kencur%20bubuk',
    price: 28000,
    recipe: [
      'Cuci beras lalu rendam selama 3 jam.',
      'Rebus kencur, jahe, dan gula jawa hingga mendidih.',
      'Blender beras yang sudah direndam dengan air rebusan rempah tadi.',
      'Saring ramuan dan jamu siap dinikmati.'
    ]
  },
  {
    id: '2',
    name: 'Kunyit Asam',
    benefits: ['Melancarkan haid', 'Anti-inflamasi', 'Menjaga berat badan'],
    ingredients: ['Kunyit', 'Asam Jawa', 'Gula Merah'],
    description: 'Rasa segar asam-manis yang membantu menjaga kesehatan kulit dan hormon wanita.',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d019cb5?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=kunyit%20asam%20instan',
    price: 32000,
    recipe: [
      'Haluskan kunyit, lalu rebus bersama asam jawa.',
      'Tambahkan gula merah dan sedikit garam.',
      'Tunggu hingga aroma harum keluar dan mendidih.',
      'Saring dan sajikan dingin lebih nikmat.'
    ]
  },
  {
    id: '3',
    name: 'Temulawak',
    benefits: ['Menjaga fungsi hati', 'Mengatasi perut kembung', 'Meningkatkan imunitas'],
    ingredients: ['Temulawak', 'Gula Aren', 'Garam'],
    description: 'Pahit namun berkhasiat tinggi untuk kesehatan hati dan empedu.',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=temulawak%20bubuk',
    price: 35000,
    recipe: [
      'Iris tipis temulawak (bisa juga diparut).',
      'Rebus air hingga mendidih, masukkan temulawak.',
      'Tambahkan gula aren dan sedikit garam untuk penyeimbang rasa.',
      'Saring airnya dan minum selagi hangat.'
    ]
  },
  {
    id: '4',
    name: 'Kunci Sirih',
    benefits: ['Menghilangkan bau badan', 'Kesehatan area kewanitaan', 'Mengatasi keputihan'],
    ingredients: ['Temu Kunci', 'Daun Sirih', 'Asam Jawa'],
    description: 'Ramuan tradisional yang sangat baik untuk menjaga kebersihan dan kesehatan organ kewanitaan.',
    image: 'https://images.unsplash.com/photo-1591122602130-10170425cc02?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=jamu%20kunci%20sirih',
    price: 25000,
    recipe: [
      'Tumbuk temu kunci dan rebus bersama daun sirih.',
      'Masukkan asam jawa untuk rasa yang seimbang.',
      'Rebus hingga air menyusut setengahnya.',
      'Saring dan minum secara rutin.'
    ]
  },
  {
    id: '5',
    name: 'Pahitan',
    benefits: ['Membersihkan darah', 'Mengatasi gatal-gatal', 'Menurunkan kolesterol'],
    ingredients: ['Sambiloto', 'Brotowali', 'Lempuyang'],
    description: 'Meski rasanya sangat pahit, jamu ini sangat ampuh untuk mendetoks racun dalam tubuh.',
    image: 'https://images.unsplash.com/photo-1464965224025-10ac958826d9?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=jamu%20pahitan%20sambiloto',
    price: 22000,
    recipe: [
      'Rebus sambiloto, air brotowali, dan lempuyang secara bersamaan.',
      'Biarkan mendidih lama hingga sarinya keluar maksimal.',
      'Ramuan ini pahit sekali, bisa diminum satu tegukan cepat.',
      'Gunakan madu sebagai penawar setelahnya.'
    ]
  },
  {
    id: '6',
    name: 'Cabe Puyang',
    benefits: ['Menghilangkan kesemutan', 'Meredakan linu-linu', 'Mengatasi pegal di pinggang'],
    ingredients: ['Cabe Jawa', 'Lempuyang', 'Jahe'],
    description: 'Jamu spesialis untuk kamu yang sering merasa pegal linu dan lelah setelah beraktivitas seharian.',
    image: 'https://images.unsplash.com/photo-1544145945-f904253db0ad?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=jamu%20cabe%20puyang',
    price: 30000,
    recipe: [
      'Tumbuk kasar cabe jawa dan lempuyang.',
      'Rebus dengan air dan tambahkan irisan jahe.',
      'Tunggu hingga air berwarna kecoklatan.',
      'Saring dan nikmati saat hangat untuk meredakan nyeri otot.'
    ]
  },
  {
    id: '7',
    name: 'Galian Singset',
    benefits: ['Menjaga bentuk tubuh', 'Mengencangkan kulit', 'Mengharumkan badan'],
    ingredients: ['Kunci Pepet', 'Lempuyang Wangi', 'Kayu Rapet'],
    description: 'Rahasia kecantikan keraton untuk menjaga tubuh tetap ideal, kencang, dan harum alami.',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=jamu%20galian%20singset',
    price: 45000,
    recipe: [
      'Cuci bersih semua bahan rimpang.',
      'Rebus dalam 3 gelas air hingga tersisa separuhnya.',
      'Tambahkan sedikit madu jika ingin rasa lebih manis.',
      'Minum secara rutin tiap sore hari.'
    ]
  },
  {
    id: '8',
    name: 'Uyup-uyup',
    benefits: ['Melancarkan ASI', 'Mendinginkan perut', 'Menghilangkan bau keringat'],
    ingredients: ['Kencur', 'Lempuyang', 'Temulawak', 'Puyang'],
    description: 'Jamu andalan untuk ibu menyusui, membantu meningkatkan kualitas dan kuantitas ASI secara alami.',
    image: 'https://images.unsplash.com/photo-1606757397441-35b5463004b7?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=jamu%20uyup%20uyup',
    price: 27000,
    recipe: [
      'Haluskan semua bahan lalu peras airnya.',
      'Tambahkan air matang hangat secukupnya.',
      'Aduk rata dan saring kembali.',
      'Sangat baik diminum pagi hari oleh ibu menyusui.'
    ]
  },
  {
    id: '9',
    name: 'Sinom',
    benefits: ['Menyegarkan tubuh', 'Melancarkan pencernaan', 'Menurunkan panas dalam'],
    ingredients: ['Daun Asam Muda', 'Kunyit', 'Gula Palem'],
    description: 'Minuman ringan tradisional yang kaya antioksidan, sangat menyegarkan diminum saat cuaca panas.',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=jamu%20sinom%20segar',
    price: 24000,
    recipe: [
      'Petik daun asam muda, cuci bersih.',
      'Rebus kunyit dan gula palem hingga mendidih.',
      'Masukkan daun asam muda ke dalam air mendidih.',
      'Matikan api dan saring setelah dingin (enak diminum dengan es).'
    ]
  },
  {
    id: '10',
    name: 'Kunyit Putih',
    benefits: ['Anti-kanker', 'Mengatasi maag', 'Meredakan peradangan'],
    ingredients: ['Kunyit Putih', 'Madu'],
    description: 'Ramuan langka yang sangat kuat untuk menangkal radikal bebas dan memperbaiki sistem pencernaan.',
    image: 'https://images.unsplash.com/photo-1627483262769-04d0a140148a?q=80&w=800&auto=format&fit=crop',
    shopeeUrl: 'https://shopee.co.id/search?keyword=ekstrak%20kunyit%20putih',
    price: 38000,
    recipe: [
      'Parut kunyit putih segar secukupnya.',
      'Peras dan ambil airnya saja.',
      'Tambahkan satu sendok madu murni.',
      'Minum setiap malam sebelum tidur untuk hasil maksimal.'
    ]
  }
];

// --- Error Handler ---
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'store'>('home');
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || undefined,
            createdAt: new Date().toISOString()
          };

          if (!userSnap.exists()) {
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(userSnap.data() as UserProfile);
          }

          // Listen for chat messages
          const msgQuery = query(
            collection(db, 'users', user.uid, 'consultations'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'asc')
          );
          
          onSnapshot(msgQuery, (snapshot) => {
            setMessages(snapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                id: doc.id, 
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
              } as ConsultationMessage;
            }));
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/consultations`);
            setErrorMsg("Gagal memuat percakapan. Silakan coba lagi.");
          });
        } catch (err) {
          console.error("Auth init error:", err);
          setErrorMsg("Gagal menginisialisasi profil.");
        }
      } else {
        setProfile(null);
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const logout = () => signOut(auth);

  const sendMessage = async () => {
    if (!user || !inputMessage.trim()) return;

    const userMsg: ConsultationMessage = {
      userId: user.uid,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setInputMessage('');
    setIsTyping(true);

    try {
      await addDoc(collection(db, 'users', user.uid, 'consultations'), {
        ...userMsg,
        timestamp: serverTimestamp()
      });

      // Get AI response
      const aiResponse = await getHerbalConsultation(messages, inputMessage);
      
      const modelMsg: ConsultationMessage = {
        userId: user.uid,
        role: 'model',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'users', user.uid, 'consultations'), {
        ...modelMsg,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/consultations`);
    } finally {
      setIsTyping(false);
    }
  };

  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [viewingJamu, setViewingJamu] = useState<JamuItem | null>(null);

  const COMMON_COMPLAINTS = [
    { id: 'pegal', label: 'Pegal Linu', icon: '💪', jamuId: ['1', '6'] },
    { id: 'haid', label: 'Nyeri Haid', icon: '🩸', jamuId: ['2'] },
    { id: 'perut', label: 'Maag/Kembung', icon: '🤢', jamuId: ['3', '10'] },
    { id: 'diet', label: 'Cantik Alami', icon: '👸', jamuId: ['7', '2'] },
    { id: 'segar', label: 'Segar & Dingin', icon: '❄️', jamuId: ['9'] },
    { id: 'asi', label: 'Ibu Menyusui', icon: '👩‍🍼', jamuId: ['8'] },
  ];

  const filteredJamu = JAMU_CATALOG.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.benefits.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedComplaint) {
      const complaint = COMMON_COMPLAINTS.find(c => c.id === selectedComplaint);
      return matchesSearch && complaint?.jamuId.includes(j.id);
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center gap-6">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-[#7B8E6F] rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-[#7B8E6F]/30"
        >
          <Leaf size={40} />
        </motion.div>
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-serif font-black text-[#2D3A26]">JamuKu</h1>
          <p className="text-[#8B8B8B] font-medium animate-pulse">Menghangatkan kuali...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Decor */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7B8E6F]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4A373]/5 rounded-full blur-[120px]"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[48px] p-12 shadow-2xl shadow-[#2D3A26]/5 border border-[#E6E6DF] relative z-10 text-center space-y-10"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-[#7B8E6F] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-[#7B8E6F]/30">
              <Leaf size={40} />
            </div>
            <h1 className="text-4xl font-serif font-black text-[#2D3A26] tracking-tighter">JamuKu</h1>
            <p className="text-[#8B8B8B] font-medium leading-relaxed">
              Selamat datang di JamuKu. <br/> Masuk untuk mendapatkan saran herbal terbaik untuk kesehatan Anda.
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={login}
              className="w-full bg-[#2D3A26] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-[#2D3A26]/20 hover:scale-[1.02] active:scale-95 transition-all text-lg"
            >
              <div className="bg-white p-1 rounded-full">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              </div>
              Lanjut dengan Google
            </button>
            <p className="text-[10px] text-[#A7C091] uppercase font-black tracking-widest pt-4">Warisan Leluhur, Teknologi Terkini</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#4A3728] font-sans selection:bg-natural-sage/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-[#E6E6DF] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#7B8E6F] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#7B8E6F]/20">
              <Leaf size={24} />
            </div>
            <span className="text-2xl font-serif font-black tracking-tighter text-[#2D3A26]">JamuKu</span>
          </div>

          <div className="hidden md:flex bg-[#F5F5F0] p-1 rounded-2xl border border-[#E6E6DF]">
            <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Sparkles size={18} />} label="Rekomendasi" />
            <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageCircle size={18} />} label="Konsultasi" />
            <NavButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<Store size={18} />} label="Toko" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-black text-[#7B8E6F] uppercase tracking-widest">{profile?.displayName}</p>
            </div>
            <button onClick={logout} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-32 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero */}
              <div className="relative rounded-[40px] overflow-hidden p-12 lg:p-20 bg-[#2D3A26] text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-5xl lg:text-7xl font-serif font-black leading-none mb-8"
                  >
                    Hidup Sehat <br/><span className="text-[#A7C091]">Alami</span> Lewat Jamu.
                  </motion.h1>
                  <p className="text-lg text-gray-300 mb-10 max-w-lg">
                    Temukan resep jamu tradisional terbaik yang disesuaikan khusus untuk kondisi tubuh Anda hari ini.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="bg-[#D4A373] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-[#D4A373]/30 hover:scale-105 transition-all"
                    >
                      Mulai Konsultasi <ArrowRight size={20} />
                    </button>
                    <button 
                      onClick={() => setShowQuiz(true)}
                      className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                    >
                      Rekomendasi Pintar <Sparkles size={20} />
                    </button>
                  </div>
                </div>
                {/* Abstract shape */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#3A4A32] skew-x-12 translate-x-1/2"></div>
              </div>

              {/* Complaints Quick Access */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#A7C091]/20 rounded-lg flex items-center justify-center text-[#7B8E6F]">
                    <Search size={18} />
                  </div>
                  <h3 className="text-xl font-serif text-[#2D3A26]">Apa yang Anda rasakan hari ini?</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {COMMON_COMPLAINTS.map((complaint) => (
                    <button
                      key={complaint.id}
                      onClick={() => setSelectedComplaint(selectedComplaint === complaint.id ? null : complaint.id)}
                      className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 text-center group ${
                        selectedComplaint === complaint.id 
                          ? 'bg-[#7B8E6F] border-[#7B8E6F] text-white shadow-xl shadow-[#7B8E6F]/30 scale-105' 
                          : 'bg-white border-[#E6E6DF] text-[#4A3728] hover:border-[#7B8E6F] shadow-sm'
                      }`}
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{complaint.icon}</span>
                      <span className="text-xs font-black uppercase tracking-wider leading-tight">{complaint.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Catalog Section */}
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-serif text-[#2D3A26]">Eksplorasi Jamu</h2>
                      {selectedComplaint && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setSelectedComplaint(null)}
                          className="flex items-center gap-2 bg-[#7B8E6F] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-[#7B8E6F]/20 hover:bg-[#6A7A5D] transition-all"
                        >
                          Tampilkan Semua ✕
                        </motion.button>
                      )}
                    </div>
                    <p className="text-[#8B8B8B] font-medium">
                      {selectedComplaint 
                        ? `Menampilkan solusi untuk ${COMMON_COMPLAINTS.find(c => c.id === selectedComplaint)?.label}` 
                        : "Banyak khasiat dalam setiap tetesnya."}
                    </p>
                  </div>
                  <div className="relative w-full md:w-auto">
                    <input 
                      type="text" 
                      placeholder="Cari keluhan atau jamu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-6 py-4 bg-white border border-[#E6E6DF] rounded-2xl w-full md:w-80 outline-none focus:border-[#7B8E6F] transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B8B]" size={20} />
                  </div>
                </div>

                {filteredJamu.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="text-6xl">🍃</div>
                    <h3 className="text-xl font-serif text-[#2D3A26]">Maaf Nak, jamunya belum ketemu.</h3>
                    <p className="text-[#8B8B8B]">Coba cari dengan kata kunci lain atau pilih permasalahan lainnya ya.</p>
                    <button 
                      onClick={() => { setSelectedComplaint(null); setSearchQuery(''); }}
                      className="text-[#7B8E6F] font-bold underline decoration-2 underline-offset-4"
                    >
                      Reset semua pencarian
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredJamu.map((jamu) => (
                      <div key={jamu.id}>
                        <JamuCard jamu={jamu} onViewDetail={() => setViewingJamu(jamu)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-16rem)] flex flex-col bg-white rounded-[40px] border border-[#E6E6DF] shadow-xl overflow-hidden"
            >
              {/* Chat Header */}
              <div className="px-8 py-6 bg-[#3A4A32] text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-[#7B8E6F] rounded-full flex items-center justify-center text-3xl">👵</div>
                <div>
                  <h3 className="font-serif text-xl">Bude JamuKu</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-green-200">Online Sekarang</span>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm">
                    <span className="flex-shrink-0">⚠️</span>
                    <p>{errorMsg}</p>
                    <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                  </div>
                )}
                
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed bg-[#F5F5F0] text-[#4A3728] rounded-tl-none border border-[#E6E6DF] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-[10px] uppercase tracking-widest text-[#8C7A6B]">Bude JamuKu</span>
                    </div>
                    Halo Nak! Apa yang sedang dirasakan hari ini? Bude siap bantu kasih saran jamu yang pas buat keluhannya. Cerita saja ya...
                  </div>
                </div>
                {messages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#2D3A26] text-white rounded-tr-none shadow-lg' 
                        : 'bg-[#F5F5F0] text-[#4A3728] rounded-tl-none border border-[#E6E6DF]'
                    }`}>
                      {msg.role === 'model' && (
                        <div className="font-bold text-[10px] uppercase tracking-widest text-[#8C7A6B] mb-2 border-b border-[#E6E6DF] pb-1 inline-block">Bude JamuKu</div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#F5F5F0] px-5 py-3 rounded-2xl border border-[#E6E6DF] flex gap-2 items-center">
                      <span className="text-[10px] text-[#8B8B8B] font-bold uppercase tracking-tighter italic">Sedang meracik jamu...</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-[#8B8B8B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-[#8B8B8B] rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1 h-1 bg-[#8B8B8B] rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-[#F5F5F0] border-t border-[#E6E6DF]">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Tanya Bude tentang keluhan tubuh Anda..."
                      className="flex-1 bg-white border border-[#E6E6DF] px-6 py-4 rounded-2xl outline-none focus:border-[#7B8E6F] transition-all shadow-inner"
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="w-14 h-14 bg-[#2D3A26] text-white flex items-center justify-center rounded-2xl disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-[#2D3A26]/20"
                    >
                      <Send size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          {activeTab === 'store' && (
            <motion.div 
              key="store"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-4xl font-serif text-[#2D3A26]">Toko Jamu Terpercaya</h2>
                <p className="text-[#8B8B8B] text-lg">Pilih produk jamu kualitas terbaik, dikirim langsung melalui Shopee Official Store.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {JAMU_CATALOG.map((jamu) => (
                  <div key={jamu.id}>
                    <ProductCard jamu={jamu} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <footer className="md:hidden fixed bottom-0 w-full bg-white border-t border-[#E6E6DF] px-6 py-4 z-40">
        <div className="flex justify-around items-center">
          <MobileNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Sparkles size={24}/>} />
          <MobileNavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageCircle size={24}/>} />
          <MobileNavItem active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<Store size={24}/>} />
        </div>
      </footer>

      {/* Jamu Detail Modal */}
      <AnimatePresence>
        {viewingJamu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingJamu(null)}
              className="absolute inset-0 bg-[#2D3A26]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setViewingJamu(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#2D3A26] transition-all"
              >
                ✕
              </button>
              
              <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                <img src={viewingJamu.image} alt={viewingJamu.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="w-full md:w-1/2 p-8 sm:p-12 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                <div>
                  <h2 className="text-4xl font-serif text-[#2D3A26] mb-4">{viewingJamu.name}</h2>
                  <p className="text-[#8B8B8B] leading-relaxed mb-6">{viewingJamu.description}</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[3px] text-[#7B8E6F]">Manfaat Utama</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {viewingJamu.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-[#4A3728] font-medium bg-[#F5F5F0] p-4 rounded-2xl border border-[#E6E6DF]">
                        <div className="w-2 h-2 bg-[#7B8E6F] rounded-full"></div>
                        {b}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[3px] text-[#7B8E6F]">Bahan Dasar</h4>
                  <p className="text-sm font-serif italic text-[#8B8B8B]">{viewingJamu.ingredients.join(', ')}</p>
                </div>

                {viewingJamu.recipe && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-[3px] text-[#7B8E6F]">Cara Membuat</h4>
                    <div className="space-y-3">
                      {viewingJamu.recipe.map((step, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7B8E6F]/10 text-[#7B8E6F] flex items-center justify-center text-[10px] font-bold group-hover:bg-[#7B8E6F] group-hover:text-white transition-colors">
                            {i + 1}
                          </div>
                          <p className="text-sm text-[#4A3728] leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-[#E6E6DF] flex flex-col gap-4 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#8B8B8B]">Informasi Pembelian</span>
                    <span className="text-2xl font-serif font-black text-[#2D3A26]">Rp {viewingJamu.price.toLocaleString('id-ID')}</span>
                  </div>
                  <a 
                    href={viewingJamu.shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#EE4D2D] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-[#EE4D2D]/30 hover:bg-[#D73211] transition-all"
                  >
                    <ShoppingCart size={22} />
                    Beli di Shopee
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Smart Recommendation Quiz */}
      <AnimatePresence>
        {showQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2D3A26]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[48px] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => { setShowQuiz(false); setQuizStep(0); setQuizScore([]); }}
                className="absolute top-8 right-8 text-[#8B8B8B] hover:text-[#2D3A26] transition-all"
              >
                ✕
              </button>

              <div className="p-12 space-y-8">
                {quizStep < 3 ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= quizStep ? 'bg-[#7B8E6F]' : 'bg-[#F5F5F0]'}`}></div>
                        ))}
                      </div>
                      <h3 className="text-3xl font-serif text-[#2D3A26]">
                        {quizStep === 0 && "Apa yang kamu rasakan?"}
                        {quizStep === 1 && "Apa fokus kesehatanmu?"}
                        {quizStep === 2 && "Lebih suka rasa yang mana?"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {quizStep === 0 && [
                        { label: 'Pegal & Capek', val: 'pegal' },
                        { label: 'Perut Tidak Enak', val: 'perut' },
                        { label: 'Kurang Bernergi', val: 'energi' },
                        { label: 'Ingin Detoks', val: 'detoks' }
                      ].map(opt => (
                        <button key={opt.val} onClick={() => { setQuizScore([...quizScore, opt.val]); setQuizStep(1); }} className="p-6 text-left border-2 border-[#E6E6DF] rounded-3xl hover:border-[#7B8E6F] hover:bg-[#FDFCF7] transition-all font-bold text-[#4A3728]">{opt.label}</button>
                      ))}

                      {quizStep === 1 && [
                        { label: 'Imunitas Tubuh', val: 'imun' },
                        { label: 'Kelancaran Hormon', val: 'wanita' },
                        { label: 'Kesehatan Hati', val: 'hati' },
                        { label: 'Kesehatan Darah', val: 'darah' }
                      ].map(opt => (
                        <button key={opt.val} onClick={() => { setQuizScore([...quizScore, opt.val]); setQuizStep(2); }} className="p-6 text-left border-2 border-[#E6E6DF] rounded-3xl hover:border-[#7B8E6F] hover:bg-[#FDFCF7] transition-all font-bold text-[#4A3728]">{opt.label}</button>
                      ))}

                      {quizStep === 2 && [
                        { label: 'Manis & Gurih', val: 'manis' },
                        { label: 'Segar & Asam', val: 'asam' },
                        { label: 'Pahit & Kuat', val: 'pahit' },
                        { label: 'Hangat & Pedas', val: 'pedas' }
                      ].map(opt => (
                        <button key={opt.val} onClick={() => { setQuizScore([...quizScore, opt.val]); setQuizStep(3); }} className="p-6 text-left border-2 border-[#E6E6DF] rounded-3xl hover:border-[#7B8E6F] hover:bg-[#FDFCF7] transition-all font-bold text-[#4A3728]">{opt.label}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-8 py-4">
                    <div className="w-20 h-20 bg-[#FDFCF7] border-2 border-[#7B8E6F] rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl shadow-[#7B8E6F]/20">
                      🌿
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-serif text-[#2D3A26]">Bude sudah dapet jamunya!</h4>
                      <p className="text-[#8B8B8B]">Berdasarkan keluhanmu, jamu ini paling cocok buat kamu minum sekarang.</p>
                    </div>
                    
                    <div className="p-6 bg-[#FDFCF7] rounded-3xl border border-[#E6E6DF] flex items-center gap-6 text-left">
                       <img src={JAMU_CATALOG[quizScore.includes('pegal') ? 0 : quizScore.includes('perut') ? 2 : quizScore.includes('wanita') ? 1 : 4].image} className="w-24 h-24 rounded-2xl object-cover" />
                       <div>
                         <h5 className="font-bold text-xl">{JAMU_CATALOG[quizScore.includes('pegal') ? 0 : quizScore.includes('perut') ? 2 : quizScore.includes('wanita') ? 1 : 4].name}</h5>
                         <p className="text-xs text-[#8B8B8B]">Saran: Minum 1 gelas tiap pagi.</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => { setShowQuiz(false); setQuizStep(0); setQuizScore([]); }} className="py-4 rounded-2xl font-bold bg-[#F5F5F0] text-[#8B8B8B]">Tutup</button>
                       <button onClick={() => { setViewingJamu(JAMU_CATALOG[quizScore.includes('pegal') ? 0 : quizScore.includes('perut') ? 2 : quizScore.includes('wanita') ? 1 : 4]); setShowQuiz(false); setQuizStep(0); setQuizScore([]); }} className="py-4 rounded-2xl font-bold bg-[#7B8E6F] text-white shadow-lg shadow-[#7B8E6F]/30">Lihat Detail</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
        active 
          ? 'bg-white text-[#2D3A26] shadow-sm' 
          : 'text-[#8B8B8B] hover:text-[#2D3A26]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavItem({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 rounded-2xl transition-all ${active ? 'bg-[#7B8E6F] text-white shadow-lg shadow-[#7B8E6F]/20' : 'text-[#8B8B8B]'}`}
    >
      {icon}
    </button>
  );
}

function JamuCard({ jamu, onViewDetail }: { jamu: JamuItem, onViewDetail: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-white rounded-[40px] border border-[#E6E6DF] overflow-hidden group shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      <div className="h-64 overflow-hidden relative">
        <img src={jamu.image} alt={jamu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[2px] px-4 py-1.5 rounded-full border border-white/30">Laris</span>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <h3 className="text-2xl font-serif text-[#2D3A26] group-hover:text-[#7B8E6F] transition-colors">{jamu.name}</h3>
          <button className="text-[#8B8B8B] hover:text-red-400 transition-colors"><Heart size={24} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {jamu.benefits.slice(0, 2).map((b, i) => (
            <span key={i} className="text-[10px] font-bold bg-[#F5F5F0] text-[#7B8E6F] px-3 py-1 rounded-full border border-[#E6E6DF]">{b}</span>
          ))}
        </div>
        <p className="text-sm text-[#8B8B8B] line-clamp-2 leading-relaxed">
          {jamu.description}
        </p>
        <button 
          onClick={onViewDetail}
          className="w-full py-4 border-2 border-[#E6E6DF] rounded-2xl text-sm font-bold flex items-center justify-center gap-2 group-hover:border-[#7B8E6F] group-hover:bg-[#7B8E6F] group-hover:text-white transition-all"
        >
          Lihat Detail <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

function ProductCard({ jamu }: { jamu: JamuItem }) {
  return (
    <div className="bg-white p-6 rounded-[35px] border border-[#E6E6DF] shadow-sm hover:shadow-xl transition-all">
      <div className="aspect-square bg-[#F5F5F0] rounded-[28px] mb-6 overflow-hidden relative group">
        <img src={jamu.image} alt={jamu.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-[#A7C091] uppercase tracking-widest">
          <Info size={12} /> Tersedia di Shopee
        </div>
        <h3 className="text-xl font-bold text-[#2D3A26]">{jamu.name} Bubuk Instan</h3>
        <p className="text-sm text-[#8B8B8B]">Kemasan 250g. Tanpa bahan pengawet.</p>
        <div className="pt-4 border-t border-[#F5F5F0] flex items-center justify-between">
          <span className="text-xl font-serif font-bold text-[#2D3A26]">Rp {jamu.price.toLocaleString('id-ID')}</span>
          <a 
            href={jamu.shopeeUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#EE4D2D] text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-[#D73211] transition-all shadow-lg shadow-[#EE4D2D]/20 active:scale-95"
          >
            <ShoppingCart size={18} /> Shopee
          </a>
        </div>
      </div>
    </div>
  );
}
