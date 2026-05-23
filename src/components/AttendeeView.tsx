import React, { useState, useEffect } from 'react';
import { POI, EngagementCampaign } from '../types';
import { 
  AlertCircle, 
  AlertTriangle, 
  Send, 
  Navigation, 
  CheckCircle,
  Clock,
  Globe,
  Check,
  Gamepad2,
  Gift,
  QrCode,
  Sparkles,
  Search,
  HelpCircle,
  CheckCircle2,
  Lock,
  Mic,
  Volume2,
  VolumeX,
  Megaphone
} from 'lucide-react';

interface AttendeeViewProps {
  pois: POI[];
  campaigns: EngagementCampaign[];
  onJoinCampaign: (campaignId: string) => void;
  onReportIncident: (data: { type: string; title: string; location: string; x: number; y: number; severity: string }) => void;
  onEgressRouteRequested: (p1: string, p2: string) => void;
  statusAlerts: Array<{ id: string; message: string; timestamp: string; level: string }>;
  onSelectPoi: (poiId: string | null) => void;
  selectedPoiId: string | null;
  greenZoneRoute?: string[] | null;
  isGreenZoneActive?: boolean;
}

type Language = 'en' | 'hi' | 'es' | 'de' | 'ta' | 'bn';

interface LanguageConfig {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳' },
];

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    lang_label: 'Language Comfort',
    lang_sub: 'Choose your default notification and safety dispatch language',
    routing_engine: 'Safe Routing Engine',
    routing_desc: 'Request real-time egress pathways bypassing active congestion spots listed on your ticket or the map.',
    route_1: 'Vanguard Arena → North Egress',
    route_1_desc: 'Fast evacuation corridor built around security corridors.',
    route_2: 'Central Food Court → South Gate',
    route_2_desc: 'Redirects crowd from food court via spacious East ring path.',
    status_clear: 'Clear Route',
    status_moderate: 'Moderate Flow',
    report_hazard: 'Self-Report Crowd Hazard',
    report_desc: 'Lodge an immediate safety dispatch ticket if you observe overcrowding, injury, or route bottlenecks.',
    success_title: 'Report Dispatched Successfully',
    success_desc: 'Our safety staff and paramedics have been alerted of your ticket.',
    category: 'Category',
    severity: 'Severity',
    issue_overview: 'Issue Overview',
    closest_sector: 'Closest Venue Sector',
    send_alert: 'Send Tactical Alert',
    broadcast_feed: 'Emergency Broadcast Feed',
    no_broadcast: 'No active tactical safety warnings broadcasted. All ingress pathways are stable.',
    alert_level: 'ALERT',
    placeholder_issue: 'e.g. Broken barricade at central alley',
    choose_sector: '-- Choose Venue Sector --',
    low: 'Low Friction',
    medium: 'Medium',
    high: 'High priority',
    overcrowding: 'Overcrowding',
    medical: 'Medical case',
    hazard: 'Obstruction',
    other: 'Other Incident',
  },
  hi: {
    lang_label: 'भाषा सुविधा (Language Comfort)',
    lang_sub: 'अपनी पसंदीदा भाषा में तत्काल सुरक्षा चेतावनी और मार्ग निर्देश देखें',
    routing_engine: 'सुरक्षित मार्ग खोजक (Safe Routing Engine)',
    routing_desc: 'अपने टिकट या मानचित्र पर दी गई भारी भीड़ वाले क्षेत्रों से बचते हुए वास्तविक समय में सुरक्षित निकासी मार्ग प्राप्त करें।',
    route_1: 'वैनगार्ड एरिना → उत्तरी निकासी द्वार',
    route_1_desc: 'सुरक्षा गलियारों के आसपास सुगम आवाजाही के लिए तैयार किया गया आपातकालीन मार्ग।',
    route_2: 'केंद्रीय फूड कोर्ट → दक्षिणी द्वार',
    route_2_desc: 'पूर्वी चक्करदार पथ के माध्यम से भीड़ को डाइवर्ट कर सुरक्षित निकास देता है।',
    status_clear: 'स्पष्ट मार्ग (Safe)',
    status_moderate: 'मध्यम भीड़ (Moderate)',
    report_hazard: 'भीड़ या सुरक्षा जोखिम रिपोर्ट करें',
    report_desc: 'यदि आप स्थल पर अत्यधिक भीड़, चोट या मार्ग अवरोध देखते हैं, तो तुरंत सुरक्षा नियंत्रण कक्ष को सूचना भेजें।',
    success_title: 'रिपोर्ट सफलतापूर्वक भेजी गई',
    success_desc: 'हमारे सुरक्षा कर्मचारियों और चिकित्सा दल को सूचित कर दिया गया है। वे जल्द मदद पहुँचाएंगे।',
    category: 'श्रेणी (Category)',
    severity: 'गंभीरता स्तर (Severity)',
    issue_overview: 'समस्या का स्पष्ट विवरण',
    closest_sector: 'निकटतम क्षेत्र का चयन करें',
    send_alert: 'सुरक्षा अलर्ट भेजें',
    broadcast_feed: 'आपातकालीन लाइव प्रसारण फ़ीड',
    no_broadcast: 'कोई सक्रिय सामरिक सुरक्षा चेतावनी प्रसारित नहीं की गई है। सभी प्रवेश मार्ग पूरी तरह से सामान्य हैं।',
    alert_level: 'विशेष चेतावनी',
    placeholder_issue: 'जैसे: केंद्रीय फूड स्टॉल के पास बैरिकेड ढीला है या भीड़ है',
    choose_sector: '-- क्षेत्र का चयन करें --',
    low: 'सामान्य अड़चन (Low)',
    medium: 'मध्यम (Medium)',
    high: 'अति आवश्यक (Critical)',
    overcrowding: 'अत्यधिक संकुलता / भीड़',
    medical: 'मेडिकल सहायता की आवश्यकता',
    hazard: 'मार्ग में कोई बाधा / अव्यवस्था',
    other: 'अन्य गंभीर समस्या',
  },
  es: {
    lang_label: 'Preferencia de Idioma',
    lang_sub: 'Seleccione su idioma para alertas de seguridad y despacho inmediato',
    routing_engine: 'Motor de Rutas Seguras',
    routing_desc: 'Solicite rutas de evacuación en tiempo real evitando puntos de congestión activos en el mapa o su ticket.',
    route_1: 'Estadio Vanguard → Salida Norte',
    route_1_desc: 'Corredor de evacuación rápida diseñado alrededor de zonas autorizadas de seguridad.',
    route_2: 'Plaza de Comidas → Puerta Sur',
    route_2_desc: 'Redirige el flujo de personas por el amplio sendero Este exterior.',
    status_clear: 'Ruta Despejada',
    status_moderate: 'Tránsito Moderado',
    report_hazard: 'Autoreporte de Peligros',
    report_desc: 'Envíe un boleto de despacho de seguridad inmediato si observa hacinamiento, accidentes o bloqueos.',
    success_title: 'Reporte Enviado con Éxito',
    success_desc: 'Nuestro personal de seguridad y paramédicos han recibido su alerta de incidentes.',
    category: 'Categoría',
    severity: 'Gravedad',
    issue_overview: 'Detalle del Incidente',
    closest_sector: 'Sector Más Cercano',
    send_alert: 'Enviar Alerta Táctica',
    broadcast_feed: 'Canal de Transmisión de Emergencia',
    no_broadcast: 'No hay alertas tácticas activas en este momento. Todos los accesos están estables.',
    alert_level: 'ALERTA',
    placeholder_issue: 'ej. Valla rota o caída en el pasillo central de comidas',
    choose_sector: '-- Seleccione Sector --',
    low: 'Fricción Baja',
    medium: 'Medio',
    high: 'Prioridad Alta',
    overcrowding: 'Hacinamiento de Personas',
    medical: 'Caso Médico / Urgencia',
    hazard: 'Obstáculo o Peligro Físico',
    other: 'Otro Tipo de Incidente',
  },
  de: {
    lang_label: 'Bevorzugte Sprache',
    lang_sub: 'Wählen Sie Ihre Standardsprache für Notrufe und Wegbeschreibungen',
    routing_engine: 'Sicherer Routing-Assistent',
    routing_desc: 'Fordern Sie Echtzeit-Rettungswege an, die Staus auf Ihrem Ticket oder der Karte intelligent umgehen.',
    route_1: 'Vanguard Arena → Nord-Ausgang',
    route_1_desc: 'Schneller, freigegebener Fluchtweg entlang der Sicherheitskorridore.',
    route_2: 'Mittelbereich Food Court → Südtor',
    route_2_desc: 'Leitet Besucherströme großräumig über den breiten Ost-Ringweg ab.',
    status_clear: 'Freie Route',
    status_moderate: 'Mäßiger Verkehr',
    report_hazard: 'Gefahrenstelle Selber Melden',
    report_desc: 'Senden Sie ein direktes Ticket, wenn Sie Überlastung, Blockaden oder Verletzte bemerken.',
    success_title: 'Meldung Erfolgreich Übermittelt',
    success_desc: 'Unser Sicherheitspersonal und Ersthelfer wurden soeben alarmiert.',
    category: 'Kategorie',
    severity: 'Dringlichkeit',
    issue_overview: 'Problembeschreibung',
    closest_sector: 'Nächster Sektor (Ort)',
    send_alert: 'Taktische Warnung Senden',
    broadcast_feed: 'Live Notfall-Übertragungskanal',
    no_broadcast: 'Keine aktiven taktischen Sicherheitswarnungen. Alle Zugangswege sind stabil.',
    alert_level: 'WARNUNG',
    placeholder_issue: 'z.B. Beschädigte Absperrung oder Engpass in der Mittelgasse',
    choose_sector: '-- Sektor auswählen --',
    low: 'Niedrige Priorität',
    medium: 'Mittel',
    high: 'Hohe Priorität',
    overcrowding: 'Überfüllung / Überlastung',
    medical: 'Medizinischer Notfall',
    hazard: 'Hindernis / Beschädigung',
    other: 'Anderer Vorfall',
  },
  ta: {
    lang_label: 'மொழி முன்னுரிமை (Language)',
    lang_sub: 'பாதுகாப்பு எச்சரிக்கைகள் மற்றும் வழிகாட்டுதல்களைப் பெற மொழியைத் தேர்ந்தெடுக்கவும்',
    routing_engine: 'பாதுகாப்பான வழிசெலுத்தல்',
    routing_desc: 'நெரிசலான பகுதிகளைத் தவிர்த்து உண்மையான நேரத்தில் பாதுகாப்பான வெளியேறும் வழியைக் கோருங்கள்.',
    route_1: 'வான்கார்ட் அரங்கம் → வடக்கு வெளியேறு வாயில்',
    route_1_desc: 'பாதுகாப்பு நடைபாதைகளின் வழியே அமைக்கப்பட்டுள்ள அதிவேக அவசரக்கால வெளியேற்றப் பாதை.',
    route_2: 'மத்திய உணவு அரங்கம் → தெற்கு வாயில்',
    route_2_desc: 'கூட்ட நெரிசலைத் தவிர்க்க கிழக்கு வட்டப் பாதை வழியாக மாற்று வழியை வழங்குகிறது.',
    status_clear: 'தெளிவான பாதை (Clear)',
    status_moderate: 'மிதமான நெரிசல் (Moderate)',
    report_hazard: 'கூட்ட நெரிசல் / ஆபத்தைப் புகார் செய்க',
    report_desc: 'நெரிசல், காயம் அல்லது வழித் தடைகளை நீங்கள் கண்டால் உடனடியாகப் பாதுகாப்புப் புகார் செய்யவும்.',
    success_title: 'புகார் வெற்றிகரமாக அனுப்பப்பட்டது',
    success_desc: 'பாதுகாப்புப் பணியாளர்கள் மற்றும் முதலுதவிக் குழுவினர் உடனடியாக நடவடிக்கை எடுப்பார்கள்.',
    category: 'வகை (Category)',
    severity: 'தீவிரத்தன்மை (Severity)',
    issue_overview: 'சிக்கலின் கண்ணோட்டம் / விபரம்',
    closest_sector: 'அருகிலுள்ள நிகழ்விட பகுதி',
    send_alert: 'பாதுகாப்பு எச்சரிக்கை அனுப்பு',
    broadcast_feed: 'அவசரக்கால ஒலிபரப்புத் தகவல்',
    no_broadcast: 'செயலில் உள்ள பாதுகாப்பு எச்சரிக்கைகள் ஏதுமில்லை. அனைத்து நுழைவுப் பாதைகளும் சீராக உள்ளன.',
    alert_level: 'எச்சரிக்கை',
    placeholder_issue: 'உ-ம்: பிரதான அவசரக்கால பாதையில் நெரிசல் அல்லது உடைந்த தடுப்பு உள்ளது',
    choose_sector: '-- பகுதியைத் தேர்ந்தெடுக்கவும் --',
    low: 'குறைந்த உராய்வு (Low)',
    medium: 'நடுத்தரம் (Medium)',
    high: 'உயர்ந்த முன்னுரிமை (High)',
    overcrowding: 'கூட்ட நெரிசல்',
    medical: 'மருத்துவ அவசரத் தேவை',
    hazard: 'பாதை அடைப்பு / ஆபத்து',
    other: 'இதரப் பிரச்சனைகள்',
  },
  bn: {
    lang_label: 'ভাষার সুবিধা (Language Comfort)',
    lang_sub: 'আপনার স্বাচ্ছন্দ্যের ভাষায় বিজ্ঞপ্তি এবং লাইভ ম্যাপের তথ্য পান',
    routing_engine: 'নিরাপদ রাউটিং ইঞ্জিন',
    routing_desc: 'আপনার টিকিট বা মানচিত্রে নথিভুক্ত হওয়া ভিড়যুক্ত এলাকা এড়িয়ে রিয়েল-টাইম নিরাপদ স্থানান্তর পথ খুঁজে নিন।',
    route_1: 'ভ্যানগার্ড এরিনা → উত্তর নিকাশী পথ',
    route_1_desc: 'নিরাপত্তা করিডোরের চারপাশে সহজে সরিয়ে নেওয়ার জন্য নির্মিত জরুরি করিডোর।',
    route_2: 'সেন্ট্রাল ফুড কোর্ট → দক্ষিণ গেট',
    route_2_desc: 'প্রশস্ত পূর্ব রিং পথ দিয়ে ফুড কোর্ট এলাকার ভিড় নিরাপদে ডাইভার্ট করে।',
    status_clear: 'পরিষ্কার রাস্তা',
    status_moderate: 'মাঝারি চলাচল',
    report_hazard: 'নিরাপত্তা ঝুঁকির স্ব-প্রতিবেদন',
    report_desc: 'আপনি অত্যধিক ভিড়, আঘাত বা পথের প্রতিবন্ধকতা লক্ষ্য করলে অবিলম্বে একটি জরুরি টিকিট তৈরি করুন।',
    success_title: 'প্রতিবেদন সফলভাবে পাঠানো হয়েছে',
    success_desc: 'আমাদের নিরাপত্তা দল এবং জরুরি প্যারামেডিকদের আপনার সমস্যা সম্পর্কে সতর্ক করা হয়েছে।',
    category: 'শ্রেণি (Category)',
    severity: 'তীব্রতার মাত্রা (Severity)',
    issue_overview: 'সমস্যার বিবরণ',
    closest_sector: 'নিকটতম ভেন্যু সেক্টর',
    send_alert: 'কৌশলগত সতর্কতা পাঠান',
    broadcast_feed: 'জরুরি সম্প্রচার ফিড',
    no_broadcast: 'বর্তমানে কোনো সক্রিয় কৌশলগত নিরাপত্তা সতর্কতা নেই। সমস্ত প্রবেশ পথ সম্পূর্ণ স্বাভাবিক।',
    alert_level: 'জরুরি সতর্কতা',
    placeholder_issue: 'যেমন: মধ্য গলিতে নিরাপত্তার বেড়া ভেঙে পড়েছে বা ভিড় বাড়ছে',
    choose_sector: '-- ভেন্যু সেক্টর নির্বাচন করুন --',
    low: 'কম সমস্যা (Low)',
    medium: 'মাঝারি (Medium)',
    high: 'উচ্চ অগ্রাধিকার (High)',
    overcrowding: 'অতিরিক্ত জনসমাগম / ভিড়',
    medical: 'চিকিৎসা সহায়তা প্রয়োজন',
    hazard: 'রাস্তায় বাঁধা বা অবজেক্ট',
    other: 'অন্যান্য জরুরি সমস্যা',
  }
};

const EXTRA_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    live_missions: 'Interactive Arena Quests',
    hq_recommendation: 'Crowd mitigation active: Accept tasks to disperse density!',
    no_active_miss: 'No active crowd engagement tasks right now. Explore the festival!',
    join_button: 'Accept Campaign & Claim Reward',
    voucher_code: 'Your reward voucher code',
    scan_instructions: 'Show this barcode to the staff at safe zone to redeem.',
    quiz_title: 'Interactive Real-time Quiz',
    quiz_instruction: 'Answer correct to verify you are redirecting away from the bottlenecks!',
    submit_quiz: 'Submit Quiz Response',
    synchronized_mode: 'Synchronized Aura Light Show Active',
    synchronized_msg: 'Hold up your phone! Your screen colors are pulsing with the center stage.',
    scavenger_target: 'Scavenger Hunt: Target Sector Is',
    hunt_success: 'Checked in at relaxed location!',
    view_route_tip: 'Tap to view evacuation path to redirect sector'
  },
  hi: {
    live_missions: 'लाइव इंटरैक्टिव क्षेत्र खोज (Interactive Quests)',
    hq_recommendation: 'भीड़ सुरक्षा प्रतिक्रिया: सहायता कार्यों को पूरा करें और पुरस्कार जीतें!',
    no_active_miss: 'वर्तमान में कोई स्थानीय खेल या अभियान सक्रिय नहीं है।',
    join_button: 'अभियान स्वीकार करें और पुरस्कार पाएं',
    voucher_code: 'आपका उपहार वाउचर कोड',
    scan_instructions: 'रिडीम करने के लिए सुरक्षित क्षेत्र के कर्मचारियों को यह बारकोड दिखाएं।',
    quiz_title: 'लाइव प्रश्नोत्तरी',
    quiz_instruction: 'संकट से बचने के लिए सही उत्तर का चयन करें!',
    submit_quiz: 'प्रश्नोत्तरी सबमिट करें',
    synchronized_mode: 'सिंक्रनाइज़ लाइट शो सक्रिय है',
    synchronized_msg: 'अपना फोन हवा में उठाएं! रंगों से अपनी स्क्रीन को चमकाएं।',
    scavenger_target: 'खजाना खोज का लक्ष्य क्षेत्र:',
    hunt_success: 'सुरक्षित स्थान पर रिपोर्ट दर्ज की गई!',
    view_route_tip: 'सुरक्षित विकल्प मार्ग देखने के लिए क्लिक करें'
  },
  es: {
    live_missions: 'Búsquedas Interactivas de Arena',
    hq_recommendation: 'Mitigación de multitudes: ¡Acepta tareas para dispersar densidad!',
    no_active_miss: 'No hay tareas activas en este momento. ¡Explora el festival!',
    join_button: 'Aceptar misión y reclamar recompensa',
    voucher_code: 'Tu código de cupón de premio',
    scan_instructions: 'Muestra este código de barras al personal en la zona segura para canjearlo.',
    quiz_title: 'Cuestionario Interactivo',
    quiz_instruction: '¡Responde correctamente para verificar tu rediccionamiento!',
    submit_quiz: 'Enviar respuesta',
    synchronized_mode: 'Espectáculo de luz síncrona activo',
    synchronized_msg: '¡Sostén tu teléfono! Tu pantalla parpadea con la música.',
    scavenger_target: 'Búsqueda del tesoro: El sector objetivo es',
    hunt_success: '¡Registrado con éxito en sector despejado!',
    view_route_tip: 'Haz clic para ver ruta de evacuación al sector seguro'
  },
  de: {
    live_missions: 'Interaktive Festival-Quests',
    hq_recommendation: 'Gegen Überfüllung: Nimm Aufgaben an, um das Areal zu entlasten!',
    no_active_miss: 'Zurzeit keine aktiven Publikumsspiele. Erkunde das Festival!',
    join_button: 'Quest annehmen & Prämie sichern',
    voucher_code: 'Dein Gutscheincode',
    scan_instructions: 'Zeige diesen Barcode dem Personal im sicheren Bereich.',
    quiz_title: 'Interaktives Quizspiel',
    quiz_instruction: 'Beantworte das Quiz richtig, um die Prämie freizuschalten!',
    submit_quiz: 'Antwort absenden',
    synchronized_mode: 'Synchronbetrieb Aura-Lichtshow aktiv',
    synchronized_msg: 'Halte dein Handy hoch! Dein Bildschirm blinkt im Takt.',
    scavenger_target: 'Schnitzeljagd: Zielsektor ist',
    hunt_success: 'Erfolgreich im sicheren Sektor eingecheckt!',
    view_route_tip: 'Klicken, um den Fluchtweg zum Zielsektor anzuzeigen'
  },
  ta: {
    live_missions: 'நேரdi ஊடாடும் சவால்கள்',
    hq_recommendation: 'நெரிசல் குறைப்பு நடவடிக்கை: கூட்ட நெரிசலைத் தவிர்க்க சவால்களில் பங்கேற்கவும்!',
    no_active_miss: 'தற்போது எந்தவொரு நேரடி விளையாட்டுகளும் இல்லை. திருவிழாவை ஆராயுங்கள்!',
    join_button: 'சவாலை ஏற்று வெகுமதியைப் பெறுங்கள்',
    voucher_code: 'உங்களது கூப்பன் குறியீடு',
    scan_instructions: 'பரிசைப் பெற பாதுகாப்பான பகுதியில் உள்ள ஊழியர்களிடம் இதைத் காண்பிக்கவும்.',
    quiz_title: 'நேரடி ஊடாடும் கேள்வி-பதில்',
    quiz_instruction: 'சரியான பதிலை அளித்து நெரிசலான பகுதியில் இருந்து நகரவும்!',
    submit_quiz: 'பதிலை சமர்ப்பிக்கவும்',
    synchronized_mode: 'ஒத்திசைக்கப்பட்ட ஒளி நிகழ்ச்சி செயல்பாடு',
    synchronized_msg: 'உங்கள் தொலைபேசியை உயர்த்துங்கள்! திரை வண்ணங்கள் அரங்கத்துடன் ஒளிர்கின்றன.',
    scavenger_target: 'பொக்கிஷ வேட்டை இலக்கு பகுதி:',
    hunt_success: 'பாதுகாப்பான பகுதியில் வெற்றிகரமாக இணைந்தீர்!',
    view_route_tip: 'பாதுகாப்பான மாற்று வழியைப் பார்க்க தட்டவும்'
  },
  bn: {
    live_missions: 'লাইভ ইন্টারঅ্যাক্টিভ অনুসন্ধান',
    hq_recommendation: 'ভিড় প্রশমন তৎপরতা: নিরাপদ স্থানান্তর করতে মিশনগুলি সম্পন্ন করুন!',
    no_active_miss: 'বর্তমানে কোনো সক্রিয় প্রচারণার মিশন নেই। উৎসবটি উপভোগ করুন!',
    join_button: 'মিশন গ্রহণ করুন এবং পুরস্কার দাবি করুন',
    voucher_code: 'আপনার পুরস্কারের ভাউচার কোড',
    scan_instructions: 'রিডিম করতে নিরাপদ জোনের কর্মীদের এই বারকোডটি প্রদর্শন করুন।',
    quiz_title: 'লাইভ কুইজ',
    quiz_instruction: 'সঠিক উত্তর দিয়ে নিশ্চিত হোন যে আপনি নিরাপদ জোনের দিকে স্থান্তারিত হচ্ছেন!',
    submit_quiz: 'কুইজের উত্তর পাঠান',
    synchronized_mode: 'রিয়েল-টাইম লাইট শো সক্রিয়',
    synchronized_msg: 'আপনার মোবাইলটি উঁচুতে ধরুন! স্ক্রীনের রং মূল মঞ্চের সাথে তাল মেলাচ্ছে।',
    scavenger_target: 'ট্রেজার হান্টের লক্ষ্য সেক্টর:',
    hunt_success: 'ঝুঁকিমুক্ত সেক্টরে সফলভাবে চেক-ইন করেছেন!',
    view_route_tip: 'বিকল্প রুট ম্যাপ প্রদর্শন করতে ট্যাপ করুন'
  }
};

export function AttendeeView({
  pois,
  campaigns = [],
  onJoinCampaign,
  onReportIncident,
  onEgressRouteRequested,
  statusAlerts,
  onSelectPoi,
  selectedPoiId,
  greenZoneRoute = null,
  isGreenZoneActive = false,
}: AttendeeViewProps) {
  // Set default language state
  const [lang, setLang] = useState<Language>('en');

  // Gamification & campaign interactive states
  const [joinedCampaigns, setJoinedCampaigns] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [lightColor, setLightColor] = useState<string>('#6366f1');
  const [huntFound, setHuntFound] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let interval: any;
    const hasActiveLightshow = campaigns.some(c => c.type === 'lightshow' && joinedCampaigns[c.id]);
    if (hasActiveLightshow) {
      interval = setInterval(() => {
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setLightColor(randomColor);
      }, 350);
    }
    return () => clearInterval(interval);
  }, [campaigns, joinedCampaigns]);

  // Custom reporting module inside the dashboard
  const [incType, setIncType] = useState('overcrowding');
  const [incTitle, setIncTitle] = useState('');
  const [incLocation, setIncLocation] = useState('');
  const [incSeverity, setIncSeverity] = useState('medium');
  const [reportedMsg, setReportedMsg] = useState(false);

  // Real-time Voice & Audio PA Systems States
  const [isListening, setIsListening] = useState(false);
  const [autoBroadcastVoice, setAutoBroadcastVoice] = useState(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [lastReadAlertId, setLastReadAlertId] = useState<string | null>(null);

  // Play audio alert via speech synthesis in target language
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Stop playing anything current
      if (isVoiceMuted) return;

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceLocales: Record<Language, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        es: 'es-ES',
        de: 'de-DE',
        ta: 'ta-IN',
        bn: 'bn-IN',
      };
      utterance.lang = voiceLocales[lang] || 'en-US';

      // Load native system voices matching language if possible
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(voiceLocales[lang]));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      
      utterance.rate = 0.95; // Slightly slower for emergency authority tone
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis playback error:', err);
    }
  };

  // Simulated Voice Dictation (High-fidelity Fallback for Sandbox Environment constraints)
  const simulateDictation = () => {
    setIsListening(true);
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      if (counter > 4) {
        clearInterval(interval);
        setIsListening(false);

        const simulatedRemarks: Record<string, string[]> = {
          overcrowding: [
            "Severe crowd buildup near the Central Food Court walkways",
            "Huge bottleneck of people blocking the Main Stage corridor",
            "Heavy crowd accumulation adjacent to the Southern gate entrance"
          ],
          medical: [
            "Dehydrated attendee needs assistance near the East Oasis lounge",
            "An individual has collapsed near Stage dome bathroom lines",
            "Medical emergency with fatigue patient near hydration booth"
          ],
          hazard: [
            "Large safety fence knocked over, blocking egress pathing",
            "An electrical line cover is loose on the floor grid",
            "Pothole risk or trip hazard near main avenue entrance"
          ],
          other: [
            "Security barrier gate 4 stuck or won't unlock",
            "Loud verbal dispute over food court ticket lanes",
            "Lost child or item reported near information canopy"
          ]
        };

        const phrases = simulatedRemarks[incType] || simulatedRemarks.overcrowding;
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        // Typewriter animation
        let currentString = "";
        let index = 0;
        const typingTimer = setInterval(() => {
          if (index < phrase.length) {
            currentString += phrase[index];
            setIncTitle(currentString);
            index++;
          } else {
            clearInterval(typingTimer);
          }
        }, 22);
      }
    }, 400);
  };

  // Browser Speech-to-Text Speech Recognition Engine
  const startDictation = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      simulateDictation();
      return;
    }

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      const recognitionLocales: Record<Language, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        es: 'es-ES',
        de: 'de-DE',
        ta: 'ta-IN',
        bn: 'bn-IN',
      };
      recognition.lang = recognitionLocales[lang] || 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setIncTitle(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech Recognition block or error (common on Sandboxed iframes), running simulated fallback:', e);
        setIsListening(false);
        simulateDictation();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.warn('Speech recognition start failed, using responsive typing simulation fallback:', error);
      simulateDictation();
    }
  };

  // Auto-broadcast new emergency announcements
  useEffect(() => {
    if (statusAlerts.length > 0 && autoBroadcastVoice && !isVoiceMuted) {
      const topAlert = statusAlerts[0];
      if (topAlert.id !== lastReadAlertId) {
        setLastReadAlertId(topAlert.id);
        
        let prefix = "Attention attendees, security PA announcement: ";
        if (lang === 'hi') prefix = "कृपया ध्यान दें, सुरक्षा सूचना: ";
        if (lang === 'es') prefix = "Atención por favor, anuncio de seguridad: ";
        if (lang === 'de') prefix = "Achtung, Sicherheitsdurchsage: ";
        if (lang === 'ta') prefix = "கவனிக்கவும், பாதுகாப்பு அறிவிப்பு: ";
        if (lang === 'bn') prefix = "দয়া করে শুনুন, নিরাপত্তা বিজ্ঞপ্তি: ";

        speakText(prefix + topAlert.message);
      }
    }
  }, [statusAlerts, autoBroadcastVoice, isVoiceMuted, lastReadAlertId, lang]);

  // Internationalized texts
  const t = TRANSLATIONS[lang];
  const ext = EXTRA_TRANSLATIONS[lang] || EXTRA_TRANSLATIONS.en;

  // Submit reporting from operations tool
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incLocation) return;

    const matchedPoi = pois.find(p => p.name.includes(incLocation) || incLocation.includes(p.name));
    const x = matchedPoi ? matchedPoi.coords.x + (Math.random() - 0.5) * 4 : Math.floor(Math.random() * 60) + 20;
    const y = matchedPoi ? matchedPoi.coords.y + (Math.random() - 0.5) * 4 : Math.floor(Math.random() * 60) + 20;

    onReportIncident({
      type: incType,
      title: incTitle,
      location: incLocation,
      x,
      y,
      severity: incSeverity,
    });

    setReportedMsg(true);
    setIncTitle('');
    setIncLocation('');
    setTimeout(() => setReportedMsg(false), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Emergency Green Zone Active Alert Banner */}
      {isGreenZoneActive && (
        <div className="bg-emerald-950/45 border-2 border-emerald-500/65 p-5 rounded-2.5xl shadow-2xl flex flex-col gap-3 relative overflow-hidden animate-pulse">
          {/* Neon vertical status line */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
          
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">HIGH EMERGENCY ADVISORY LIVE</span>
          </div>

          <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
            🚨 Active Green Zone Evacuation Route Deployed!
          </h4>
          
          <p className="text-[11.5px] text-emerald-250 leading-relaxed">
            Organizers have cleared and deployed a secure, high-priority emergency path directly through the venue. Follow the bright pulsing green corridor highlighted on your map below.
          </p>

          {/* Sequential Path visualizer for the attendee */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 border border-emerald-950/60 p-2.5 rounded-xl">
            {greenZoneRoute && greenZoneRoute.length > 0 ? (
              greenZoneRoute.map((nodeId, idx) => {
                const poi = pois.find(p => p.id === nodeId);
                return (
                  <React.Fragment key={nodeId}>
                    {idx > 0 && <span className="text-emerald-500 text-[10px] font-bold">➔</span>}
                    <div className="flex items-center gap-1 text-[11px] font-mono text-white">
                      <span className="bg-emerald-600 border border-emerald-400/30 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold select-none">{idx + 1}</span>
                      <span className="font-semibold">{poi ? poi.name.split(' (')[0] : nodeId}</span>
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <span className="text-slate-400 text-xs italic font-mono p-1">Compiling route...</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-1 text-[10px] sm:text-[11px] gap-2 flex-wrap">
            <span className="text-emerald-400/85 italic font-medium leading-none">Avoids overcrowded Central Boulevard & Food Courts</span>
            
            <button
              onClick={() => {
                if (greenZoneRoute && greenZoneRoute.length >= 2) {
                  const startPoiPoi = pois.find(p => p.id === greenZoneRoute[0]);
                  const endPoiPoi = pois.find(p => p.id === greenZoneRoute[greenZoneRoute.length - 1]);
                  const startPoi = startPoiPoi ? startPoiPoi.name : "Main Stage";
                  const endPoi = endPoiPoi ? endPoiPoi.name : "Exit";
                  onEgressRouteRequested(startPoi, endPoi);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-700/85 hover:bg-emerald-650 text-white font-bold transition-all hover:scale-102 flex items-center gap-1 shadow-sm shrink-0 uppercase tracking-wide text-[10px] cursor-pointer"
            >
              <Navigation className="w-3 h-3 text-emerald-100 animate-bounce" />
              Reroute Me Now
            </button>
          </div>
        </div>
      )}

      {/* LANGUAGE COMFORT BAR */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 id="language-interact-title" className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              {t.lang_label}
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-snug">
              {t.lang_sub}
            </p>
          </div>
        </div>

        {/* List of active languages */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {LANGUAGES.map((l) => {
            const isSelected = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600/20 border-indigo-500/80 text-white font-bold ring-2 ring-indigo-500/20' 
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-lg mb-0.5 leading-none select-none">{l.flag}</span>
                <span className="text-[10px] font-medium leading-tight">{l.nativeLabel}</span>
                <span className="text-[8px] opacity-60 font-mono tracking-wider uppercase leading-none mt-0.5">{l.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CROWD ENGAGEMENT & GAMIFICATION MISSIONS */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            {ext.live_missions}
          </h3>
          {campaigns.length > 0 && (
            <span className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-mono animate-pulse">
              {campaigns.length} Active Challenges
            </span>
          )}
        </div>

        {campaigns.length === 0 ? (
          <p className="text-slate-500 text-[11px] py-4 text-center">
            {ext.no_active_miss}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[10px] rounded-lg">
              🎯 {ext.hq_recommendation}
            </div>

            {campaigns.map((c) => {
              const isJoined = joinedCampaigns[c.id];
              const isQuiz = c.type === 'quiz';
              const isLightshow = c.type === 'lightshow';
              const isHunt = c.type === 'hunt';
              const isDiscount = c.type === 'discount';

              return (
                <div 
                  key={c.id} 
                  className={`border rounded-xl p-4 transition-all overflow-hidden ${
                    isJoined 
                      ? 'bg-slate-950 border-emerald-500/50 shadow-md shadow-emerald-950/20' 
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                      Sector Quest: {c.type}
                    </span>
                    {isJoined && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/50">
                        In Progress
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 mb-1">{c.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{c.description}</p>

                  {/* Redirection Alert Helper Bar */}
                  {c.redirectPoiName && (
                    <button
                      onClick={() => {
                        onEgressRouteRequested(c.targetPoiName, c.redirectPoiName!);
                        if (onSelectPoi) onSelectPoi(c.redirectPoiId || null);
                      }}
                      className="w-full text-left bg-indigo-950/25 hover:bg-indigo-950/40 border border-indigo-900/40 p-2 rounded-lg text-[10px] flex items-center justify-between gap-2 mb-3.5 transition-colors text-indigo-300 font-mono"
                    >
                      <span>➔ Reroute to: <strong>{c.redirectPoiName.split(' (')[0]}</strong></span>
                      <span className="text-[8px] bg-indigo-900/60 px-1 rounded hover:text-white underline">{ext.view_route_tip}</span>
                    </button>
                  )}

                  {!isJoined ? (
                    <button
                      onClick={() => {
                        setJoinedCampaigns(prev => ({ ...prev, [c.id]: true }));
                        if (onJoinCampaign) onJoinCampaign(c.id);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      {ext.join_button}
                    </button>
                  ) : (
                    <div className="border-t border-slate-800/80 pt-3.5 mt-2.5 space-y-3">
                      
                      {/* 1. QUIZ MINIGAME */}
                      {isQuiz && (
                        <div className="space-y-3">
                          <div className="bg-indigo-950/15 border border-indigo-900/30 p-2.5 rounded-lg">
                            <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 font-sans">
                              <HelpCircle className="w-3.5 h-3.5" />
                              {ext.quiz_title}
                            </span>
                            <p className="text-[11px] text-slate-300 mt-1">
                              Which behavior is most effective for alleviating congestion in crowd clusters?
                            </p>
                          </div>

                          {quizAnswers[c.id] ? (
                            <div className="bg-emerald-950/30 border border-emerald-900/60 p-3 rounded-xl flex items-center gap-3">
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                              <div className="text-[10px]">
                                <span className="font-bold text-emerald-300 block">Correct Option chosen!</span>
                                <span className="text-slate-400 leading-tight">Walk to redirect sector to claim {c.rewardValue}.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-[10.5px]">
                              {[
                                { key: 'A', text: 'Stand still and document event on your phone.' },
                                { key: 'B', text: 'Migrate intentionally to designated relaxed zones.' },
                                { key: 'C', text: 'Shout and force your way through queues.' }
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [c.id]: opt.key }))}
                                  className="w-full text-left bg-slate-900 hover:bg-slate-850 p-2 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-slate-300 transition-colors"
                                >
                                  <strong>{opt.key}.</strong> {opt.text}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. LIGHT SHOW FLASH MINI */}
                      {isLightshow && (
                        <div className="space-y-3.5 text-center">
                          <span className="text-[10px] font-mono text-purple-400 block tracking-wider uppercase font-bold flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
                            {ext.synchronized_mode}
                          </span>
                          
                          <div 
                            style={{ backgroundColor: lightColor }} 
                            className="w-full h-24 rounded-2xl shadow-inner border border-white/5 flex items-center justify-center transition-colors duration-200"
                          >
                            <span className="mix-blend-difference text-white text-[10px] font-bold tracking-widest text-center uppercase animate-pulse">
                              HOLD ME HIGH
                            </span>
                          </div>

                          <p className="text-[10.5px] text-slate-400 leading-snug">
                            {ext.synchronized_msg}
                          </p>
                        </div>
                      )}

                      {/* 3. SCAVENGER QUEST DISTANCE HELPER */}
                      {isHunt && (
                        <div className="space-y-3">
                          <span className="text-[10.5px] font-mono text-teal-400 block tracking-wider uppercase font-bold">
                            🔍 {ext.scavenger_target} {c.redirectPoiName?.split(' (')[0] || 'East Oasis'}
                          </span>

                          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Proximity Scanner:</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {huntFound[c.id] ? '0m (ARRIVED)' : '84m Away'}
                              </span>
                            </div>

                            <div className="w-full bg-slate-950 rounded-full h-1.5 shadow-inner overflow-hidden mb-2">
                              <div 
                                style={{ width: huntFound[c.id] ? '100%' : '75%' }} 
                                className="bg-teal-500 h-full transition-all duration-1000" 
                              />
                            </div>

                            {!huntFound[c.id] ? (
                              <button
                                type="button"
                                onClick={() => setHuntFound(prev => ({ ...prev, [c.id]: true }))}
                                className="w-full bg-teal-900 hover:bg-teal-800 text-teal-200 text-[10px] py-1.5 rounded transition-all cursor-pointer font-bold uppercase"
                              >
                                Simulate Check-in at safe zone
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] mt-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>{ext.hunt_success}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4. FLASH DISCOUNT CHECK CODES */}
                      {isDiscount && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-amber-500 font-bold block uppercase tracking-wider">
                            🎟️ {ext.voucher_code}
                          </span>

                          <div className="bg-slate-900 p-3.5 border border-amber-950/40 rounded-xl space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-mono font-bold text-white tracking-widest text-sm">REDUCE-CROWD-50</span>
                                <span className="text-[9px] text-slate-500 block">Valid exclusively at the Relaxed Food court vendors</span>
                              </div>
                              <QrCode className="w-9 h-9 text-slate-300" />
                            </div>

                            <p className="text-[9px] text-slate-500 leading-snug border-t border-slate-800/80 pt-2 font-sans">
                              {ext.scan_instructions}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Voucher / Loot Badge code */}
                      <div className="bg-indigo-950/20 text-indigo-400 p-2.5 rounded-xl text-[10px] border border-indigo-900/30 flex items-center justify-between gap-2 leading-none">
                        <div className="flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-indigo-400" />
                          <span>Status: Claimed <strong>{c.rewardValue}</strong></span>
                        </div>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. Safe Routing Engine */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          {t.routing_engine}
        </h3>
        <p className="text-[11px] text-slate-400 mb-4 leading-normal">
          {t.routing_desc}
        </p>

        <div className="space-y-2.5">
          <button 
            onClick={() => onEgressRouteRequested('Main Stage (Vanguard Dome)', 'North Emergency Egress & Exit')}
            className="w-full text-left bg-slate-950 border border-slate-800 p-3 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
              <span className="truncate w-full pr-2 text-left group-hover:text-indigo-400 transition-colors">{t.route_1}</span>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">{t.status_clear}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{t.route_1_desc}</p>
          </button>

          <button 
            onClick={() => onEgressRouteRequested('Central Boulevard & Food Court', 'Main South Entrance Gate')}
            className="w-full text-left bg-slate-950 border border-slate-800 p-3 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
              <span className="truncate w-full pr-2 text-left group-hover:text-amber-400 transition-colors">{t.route_2}</span>
              <span className="text-[9px] text-amber-400 bg-amber-950/40 border border-amber-900/60 px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">{t.status_moderate}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{t.route_2_desc}</p>
          </button>
        </div>
      </div>

      {/* 2. Self-Report Crowd Hazard */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          {t.report_hazard}
        </h3>
        <p className="text-[11px] text-slate-400 mb-4 leading-normal">
          {t.report_desc}
        </p>

        {reportedMsg ? (
          <div className="bg-emerald-950/25 border border-emerald-900 text-emerald-400 text-xs rounded-xl p-5 text-center space-y-2 animate-fade-in">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
            <span className="font-bold uppercase block text-[10px]">{t.success_title}</span>
            <p className="text-[10px] text-slate-400">{t.success_desc}</p>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">{t.category}</label>
                <select
                  value={incType}
                  onChange={(e) => setIncType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-[11px] rounded-lg p-2 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="overcrowding">{t.overcrowding}</option>
                  <option value="medical">{t.medical}</option>
                  <option value="hazard">{t.hazard}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">{t.severity}</label>
                <select
                  value={incSeverity}
                  onChange={(e) => setIncSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-[11px] rounded-lg p-2 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="low">{t.low}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="high">{t.high}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">{t.issue_overview}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={t.placeholder_issue}
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 focus:outline-none focus:border-indigo-500 font-sans"
                />
                <button
                  type="button"
                  onClick={startDictation}
                  className={`px-3.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                    isListening
                      ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400'
                  }`}
                  id="voice-dictation-trigger"
                  title="Dictate incident using Voice Command"
                >
                  <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-red-400 animate-bounce' : ''}`} />
                </button>
              </div>
              {isListening && (
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-red-400 bg-red-950/20 border border-red-900/50 p-2 rounded-lg animate-fade-in">
                  <div className="flex gap-0.5 items-center justify-center shrink-0">
                    <span className="w-0.75 bg-red-500 rounded-full animate-pulse" style={{ height: '6px' }}></span>
                    <span className="w-0.75 bg-red-400 rounded-full animate-pulse delay-75" style={{ height: '12px' }}></span>
                    <span className="w-0.75 bg-red-500 rounded-full animate-pulse delay-150" style={{ height: '8px' }}></span>
                  </div>
                  <span className="font-mono text-[9.5px]">PA Mic listening... Speak or wait for typewrite simulator</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">{t.closest_sector}</label>
              <select
                value={incLocation}
                required
                onChange={(e) => setIncLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">{t.choose_sector}</option>
                {pois.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:translate-y-px"
            >
              <Send className="w-3.5 h-3.5" />
              {t.send_alert}
            </button>
          </form>
        )}
      </div>

      {/* 3. Emergency Dispatch Announcements */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
          <span>{t.broadcast_feed}</span>
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        </h3>

        {/* Real-time Voice Broadcast PA Controls inline toolbar */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-850/60 mb-3 ml-0.5 mr-0.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${
              isVoiceMuted 
                ? 'bg-slate-900 border-slate-850 text-slate-500' 
                : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'
            }`}>
              <Megaphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-200 block text-[9px] uppercase font-mono tracking-wider">Venue PA Broadcast</span>
              <span className="text-[8px] text-slate-500 font-medium italic block">Synthesizes safety updates aloud</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer text-[9px] text-slate-400 hover:text-slate-200 select-none font-semibold">
              <input
                type="checkbox"
                checked={autoBroadcastVoice}
                onChange={(e) => setAutoBroadcastVoice(e.target.checked)}
                className="accent-indigo-600 cursor-pointer w-2.5 h-2.5"
                title="Automatically announce incoming system alerts aloud"
              />
              <span>TTP</span>
            </label>
            <button
              onClick={() => {
                const isNextMuted = !isVoiceMuted;
                setIsVoiceMuted(isNextMuted);
                if (isNextMuted && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                isVoiceMuted
                  ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-500'
                  : 'bg-slate-950 hover:bg-slate-900 border-indigo-500/20 text-indigo-400'
              }`}
              title={isVoiceMuted ? "Unmute PA Voice System" : "Mute PA Voice System"}
            >
              {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
          {statusAlerts.length === 0 ? (
            <p className="text-slate-500 text-[11px] py-6 text-center">
              {t.no_broadcast}
            </p>
          ) : (
            statusAlerts.map((al) => (
              <div
                key={al.id}
                className={`p-3 rounded-lg border text-xs leading-normal relative group/alert ${
                  al.level === 'critical' || al.level === 'high'
                    ? 'bg-rose-950/20 border-rose-900/40 text-rose-300 font-sans'
                    : 'bg-amber-950/15 border-amber-900/30 text-amber-300 font-sans'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[9.5px] uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{al.level.toUpperCase()} {t.alert_level}</span>
                  </div>
                  <button
                    onClick={() => speakText(al.message)}
                    className="p-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer shadow-xs opacity-75 hover:opacity-100 flex items-center justify-center"
                    title="Speak notice aloud in native portal voice"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pr-2">{al.message}</p>
                <div className="flex items-center justify-end gap-1 mt-2 text-[8.5px] text-slate-500 font-mono border-t border-slate-850/50 pt-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
