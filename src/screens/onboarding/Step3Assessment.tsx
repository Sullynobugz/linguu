'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Clock, ChevronRight } from 'lucide-react';
import { useProgress } from '../../store/ProgressContext';
import { OnboardingLayout } from './OnboardingLayout';
import { t } from '../../i18n';
import { ttsSpeak } from '../../api/openaiAudio';
import { getWidCode, trackAssessment } from '../../lib/widTracking';
import type { Level, Language } from '../../types';

// ── Fragen-Typen ─────────────────────────────────────────────────────────────

interface AudioQuestion {
  id: number;
  type: 'audio';
  // Deutscher Satz, der via TTS abgespielt wird — bleibt verdeckt bis zur Antwort
  audioText: string;
  questionByLang: Record<Language, string>;
  optionsByLang: Record<Language, string[]>; // correct always index 0 before shuffle
  level: 'A1' | 'A2' | 'B1' | 'B2';
}

interface ChoiceQuestion {
  id: number;
  type: 'choice';
  questionDE: string;
  hintByLang: Record<Language, string>;
  options: string[];
  correct: number;
  level: 'A1' | 'A2' | 'B1' | 'B2';
}

type RawQuestion = AudioQuestion | ChoiceQuestion;

// ── Fragenkatalog (15 Fragen: 5× A1, 5× A2, 5× B1) ─────────────────────────

const QUESTIONS: RawQuestion[] = [
  // A1 — Audio
  {
    id: 1, type: 'audio', level: 'A1',
    audioText: 'Guten Morgen, wie geht es Ihnen?',
    questionByLang: {
      ar: 'ماذا سمعت؟', uk: 'Що ви почули?', es: '¿Qué escuchaste?', en: 'What did you hear?',
      de: 'Was haben Sie gehört?', tr: 'Ne duydunuz?', pl: 'Co usłyszałeś?', ro: 'Ce ai auzit?', ru: 'Что вы услышали?',
      ku: 'Te çi bihîst?',
    },
    optionsByLang: {
      ar: ['صباح الخير، كيف حالك؟', 'مساء الخير، هل أنت بخير؟', 'إلى اللقاء، أراك غداً', 'شكراً جزيلاً'],
      uk: ['Доброго ранку, як справи?', 'Доброго вечора, ти гаразд?', 'До побачення, до завтра', 'Дуже дякую'],
      es: ['Buenos días, ¿cómo estás?', 'Buenas noches, ¿estás bien?', 'Hasta luego, nos vemos mañana', 'Muchas gracias'],
      en: ['Good morning, how are you?', 'Good evening, are you okay?', 'Goodbye, see you tomorrow', 'Thank you very much'],
      de: ['Guten Morgen, wie geht es Ihnen?', 'Guten Abend, geht es Ihnen gut?', 'Auf Wiedersehen, bis morgen', 'Vielen Dank'],
      tr: ['Günaydın, nasılsınız?', 'İyi akşamlar, iyi misiniz?', 'Görüşürüz, yarın görüşürüz', 'Çok teşekkür ederim'],
      pl: ['Dzień dobry, jak się pan/pani miewa?', 'Dobry wieczór, dobrze?', 'Do widzenia, do jutra', 'Bardzo dziękuję'],
      ro: ['Bună dimineața, cum vă simțiți?', 'Bună seara, ești bine?', 'La revedere, pe mâine', 'Mulțumesc mult'],
      ru: ['Доброе утро, как вы?', 'Добрый вечер, вы в порядке?', 'До свидания, до завтра', 'Большое спасибо'],
      ku: ['Sibe baş, tu çawa yî?', 'Êvar baş, tu baş î?', 'Bi xatirê te, heta sibê', 'Gelek spas'],
    },
  },
  {
    id: 2, type: 'audio', level: 'A1',
    audioText: 'Bitte zeigen Sie mir Ihren Ausweis.',
    questionByLang: {
      ar: 'ماذا طُلب منك؟', uk: 'Що від вас попросили?', es: '¿Qué te pidieron?', en: 'What were you asked to do?',
      de: 'Was wurde von Ihnen verlangt?', tr: 'Sizden ne istendi?', pl: 'O co poproszono?', ro: 'Ce ți s-a cerut?', ru: 'О чём вас попросили?',
      ku: 'Ji te çi hat xwestin?',
    },
    optionsByLang: {
      ar: ['أرِ بطاقة هويتك من فضلك', 'اجلس من فضلك', 'انتظر هنا من فضلك', 'أملأ هذا النموذج من فضلك'],
      uk: ['Будь ласка, покажіть ваше посвідчення', 'Будь ласка, сядьте', 'Будь ласка, зачекайте тут', 'Будь ласка, заповніть цей бланк'],
      es: ['Muestre su documento de identidad', 'Siéntese, por favor', 'Espere aquí, por favor', 'Rellene este formulario'],
      en: ['Show your ID, please', 'Please sit down', 'Wait here, please', 'Fill in this form, please'],
      de: ['Zeigen Sie Ihren Ausweis', 'Setzen Sie sich bitte', 'Warten Sie hier bitte', 'Füllen Sie dieses Formular aus'],
      tr: ['Kimliğinizi gösterin lütfen', 'Lütfen oturun', 'Burada bekleyin lütfen', 'Bu formu doldurun lütfen'],
      pl: ['Pokaż dowód tożsamości', 'Proszę usiąść', 'Proszę czekać tutaj', 'Proszę wypełnić formularz'],
      ro: ['Arătați-vă actul de identitate', 'Vă rog să stați jos', 'Așteptați aici, vă rog', 'Completați acest formular'],
      ru: ['Покажите ваше удостоверение', 'Пожалуйста, присядьте', 'Подождите здесь, пожалуйста', 'Заполните эту форму'],
      ku: ['Ji kerema xwe nasnameya xwe nîşan bide', 'Ji kerema xwe rûne', 'Ji kerema xwe li vir bisekine', 'Ji kerema xwe vê formê tijî bike'],
    },
  },
  {
    id: 3, type: 'audio', level: 'A1',
    audioText: 'Das Büro ist heute geschlossen.',
    questionByLang: {
      ar: 'ماذا سمعت عن المكتب؟', uk: 'Що ви почули про офіс?', es: '¿Qué escuchaste sobre la oficina?', en: 'What did you hear about the office?',
      de: 'Was haben Sie über das Büro gehört?', tr: 'Ofis hakkında ne duydunuz?', pl: 'Co usłyszałeś o biurze?', ro: 'Ce ai auzit despre birou?', ru: 'Что вы услышали об офисе?',
      ku: 'Te derbarê nivîsgehê de çi bihîst?',
    },
    optionsByLang: {
      ar: ['المكتب مغلق اليوم', 'المكتب مفتوح غداً', 'المكتب مشغول جداً', 'المكتب في الطابق الثاني'],
      uk: ['Офіс сьогодні закритий', 'Офіс відкритий завтра', 'Офіс дуже зайнятий', 'Офіс на другому поверсі'],
      es: ['La oficina está cerrada hoy', 'La oficina abre mañana', 'La oficina está muy ocupada', 'La oficina está en el segundo piso'],
      en: ['The office is closed today', 'The office opens tomorrow', 'The office is very busy', 'The office is on the second floor'],
      de: ['Das Büro ist heute geschlossen', 'Das Büro öffnet morgen', 'Das Büro ist sehr beschäftigt', 'Das Büro ist im zweiten Stock'],
      tr: ['Ofis bugün kapalı', 'Ofis yarın açık', 'Ofis çok meşgul', 'Ofis ikinci katta'],
      pl: ['Biuro jest dziś zamknięte', 'Biuro jutro otwarte', 'Biuro jest bardzo zajęte', 'Biuro jest na drugim piętrze'],
      ro: ['Biroul este închis azi', 'Biroul deschide mâine', 'Biroul este foarte ocupat', 'Biroul este la etajul doi'],
      ru: ['Офис сегодня закрыт', 'Офис открыт завтра', 'Офис очень занят', 'Офис на втором этаже'],
      ku: ['Nivîsgeh îro girtî ye', 'Nivîsgeh sibê vedibe', 'Nivîsgeh pir mijûl e', 'Nivîsgeh li qata duyemîn e'],
    },
  },
  // A1 — Choice
  {
    id: 4, type: 'choice', level: 'A1',
    questionDE: 'Ergänze: "Ich ___ aus der Ukraine."',
    hintByLang: {
      ar: 'اختر الفعل الصحيح', uk: 'Обери правильне дієслово', es: 'Elige el verbo correcto', en: 'Choose the correct verb',
      de: 'Wähle das richtige Verb', tr: 'Doğru fiili seçin', pl: 'Wybierz właściwy czasownik', ro: 'Alege verbul corect', ru: 'Выберите правильный глагол',
      ku: 'Lêkera rast hilbijêre',
    },
    options: ['habe', 'ist', 'bin', 'sind'],
    correct: 2,
  },
  {
    id: 5, type: 'choice', level: 'A1',
    questionDE: 'Was bedeutet "Entschuldigung"?',
    hintByLang: {
      ar: 'هذه كلمة مهمة جداً في المكاتب', uk: 'Це дуже важливе слово в установах', es: 'Es una palabra muy importante en oficinas', en: 'This is a very important word in offices',
      de: 'Das ist ein sehr wichtiges Wort', tr: 'Bu ofislerde çok önemli bir kelime', pl: 'To bardzo ważne słowo w urzędach', ro: 'Este un cuvânt foarte important în birouri', ru: 'Это очень важное слово в учреждениях',
      ku: 'Ev di nivîsgehan de peyveke pir girîng e',
    },
    options: ['Danke', 'Tschüss', 'Entschuldigung / Excuse me', 'Bitte'],
    correct: 2,
  },
  // A2 — Audio
  {
    id: 6, type: 'audio', level: 'A2',
    audioText: 'Ich hätte gerne einen Termin beim Arzt.',
    questionByLang: {
      ar: 'ماذا أراد الشخص؟', uk: 'Чого хотіла людина?', es: '¿Qué quería la persona?', en: 'What did the person want?',
      de: 'Was wollte die Person?', tr: 'Kişi ne istedi?', pl: 'Czego chciała osoba?', ro: 'Ce a vrut persoana?', ru: 'Чего хотел человек?',
      ku: 'Kesê çi dixwest?',
    },
    optionsByLang: {
      ar: ['موعد عند الطبيب', 'وصفة طبية', 'المغادرة المبكرة', 'حجز غرفة في المستشفى'],
      uk: ['Запис до лікаря', 'Рецепт', 'Раннє виписання', 'Бронювання палати в лікарні'],
      es: ['Una cita con el médico', 'Una receta médica', 'El alta temprana', 'Reservar una habitación en el hospital'],
      en: ['An appointment with the doctor', 'A prescription', 'Early discharge', 'Book a hospital room'],
      de: ['Einen Termin beim Arzt', 'Ein Rezept', 'Frühzeitige Entlassung', 'Ein Krankenhausbett buchen'],
      tr: ['Doktor randevusu', 'Reçete', 'Erken taburculuk', 'Hastane odası rezervasyonu'],
      pl: ['Wizyta u lekarza', 'Receptę', 'Wczesne wypisanie', 'Rezerwacja pokoju szpitalnego'],
      ro: ['O programare la medic', 'O rețetă', 'Externare timpurie', 'Rezervare cameră spital'],
      ru: ['Запись к врачу', 'Рецепт', 'Ранняя выписка', 'Бронирование палаты'],
      ku: ['Randevûyek li cem bijîjk', 'Reçeteyek', 'Berdana zû', 'Vejandina odeya nexweşxaneyê'],
    },
  },
  {
    id: 7, type: 'audio', level: 'A2',
    audioText: 'Können Sie das bitte langsamer wiederholen?',
    questionByLang: {
      ar: 'ماذا طلب الشخص؟', uk: 'Про що попросила людина?', es: '¿Qué pidió la persona?', en: 'What did the person ask for?',
      de: 'Worum bat die Person?', tr: 'Kişi ne istedi?', pl: 'O co poprosił?', ro: 'Ce a cerut persoana?', ru: 'О чём попросил человек?',
      ku: 'Kesê tika çi kir?',
    },
    optionsByLang: {
      ar: ['تكرار الشيء بشكل أبطأ', 'الكتابة أكثر', 'التحدث بصوت أعلى', 'إيقاف الاجتماع'],
      uk: ['Повторити повільніше', 'Написати більше', 'Говорити голосніше', 'Зупинити зустріч'],
      es: ['Repetir más despacio', 'Escribir más', 'Hablar más alto', 'Detener la reunión'],
      en: ['Repeat more slowly', 'Write more', 'Speak louder', 'Stop the meeting'],
      de: ['Langsamer wiederholen', 'Mehr aufschreiben', 'Lauter sprechen', 'Die Besprechung stoppen'],
      tr: ['Daha yavaş tekrarlamak', 'Daha fazla yazmak', 'Daha yüksek sesle konuşmak', 'Toplantıyı durdurmak'],
      pl: ['Powtórzyć wolniej', 'Więcej pisać', 'Mówić głośniej', 'Zatrzymać spotkanie'],
      ro: ['Repetați mai rar', 'Să scrie mai mult', 'Vorbiți mai tare', 'Opriți ședința'],
      ru: ['Повторить медленнее', 'Писать больше', 'Говорить громче', 'Остановить встречу'],
      ku: ['Hêdîtir dubare bike', 'Bêtir binivîse', 'Bilindtir biaxive', 'Civînê rawestîne'],
    },
  },
  {
    id: 8, type: 'audio', level: 'A2',
    audioText: 'Die Unterlagen müssen bis Freitag eingereicht werden.',
    questionByLang: {
      ar: 'ما الموعد النهائي لتقديم الوثائق؟', uk: 'Коли потрібно подати документи?', es: '¿Cuál es el plazo para presentar los documentos?', en: 'What is the deadline for submitting documents?',
      de: 'Bis wann müssen die Unterlagen eingereicht werden?', tr: 'Belgeler ne zamana kadar teslim edilmeli?', pl: 'Kiedy należy złożyć dokumenty?', ro: 'Când trebuie depuse documentele?', ru: 'Когда нужно сдать документы?',
      ku: 'Belge divê heta kengê werin radestkirin?',
    },
    optionsByLang: {
      ar: ['حتى يوم الجمعة', 'حتى يوم الاثنين', 'في أي وقت', 'في الأسبوع القادم'],
      uk: ["До п'ятниці", 'До понеділка', 'У будь-який час', 'Наступного тижня'],
      es: ['Hasta el viernes', 'Hasta el lunes', 'En cualquier momento', 'La semana que viene'],
      en: ['By Friday', 'By Monday', 'At any time', 'Next week'],
      de: ['Bis Freitag', 'Bis Montag', 'Zu jeder Zeit', 'Nächste Woche'],
      tr: ['Cuma\'ya kadar', 'Pazartesi\'ye kadar', 'Herhangi bir zamanda', 'Gelecek hafta'],
      pl: ['Do piątku', 'Do poniedziałku', 'W dowolnym czasie', 'W przyszłym tygodniu'],
      ro: ['Până vineri', 'Până luni', 'Oricând', 'Săptămâna viitoare'],
      ru: ['До пятницы', 'До понедельника', 'В любое время', 'На следующей неделе'],
      ku: ['Heta Înê', 'Heta Duşemê', 'Her dem', 'Hefteya bê'],
    },
  },
  // A2 — Choice
  {
    id: 9, type: 'choice', level: 'A2',
    questionDE: 'Welcher Satz ist formell (für Behörden geeignet)?',
    hintByLang: {
      ar: 'أي جملة مناسبة للمكاتب الرسمية؟', uk: 'Яка фраза підходить для офіційних установ?', es: '¿Qué frase es adecuada para organismos oficiales?', en: 'Which phrase is suitable for official agencies?',
      de: 'Welcher Satz ist für Ämter geeignet?', tr: 'Hangi cümle resmi kurumlar için uygundur?', pl: 'Które zdanie jest odpowiednie dla urzędów?', ro: 'Care frază este potrivită pentru instituții oficiale?', ru: 'Какая фраза подходит для официальных учреждений?',
      ku: 'Kîjan hevok ji bo saziyên fermî guncan e?',
    },
    options: [
      'Ich würde gerne einen Termin vereinbaren.',
      'Hey, ich brauch nen Termin!',
      'Können wir uns mal treffen?',
      'Wann habt ihr Zeit für mich?',
    ],
    correct: 0,
  },
  {
    id: 10, type: 'choice', level: 'A2',
    questionDE: 'Was bedeutet "Bescheid geben"?',
    hintByLang: {
      ar: 'تعبير شائع في المكاتب والإدارات', uk: 'Поширений вираз в установах', es: 'Expresión común en oficinas', en: 'A common phrase in offices and administrations',
      de: 'Ein häufiger Ausdruck in Ämtern', tr: 'Ofislerde yaygın bir ifade', pl: 'Popularne wyrażenie w urzędach', ro: 'Expresie comună în birouri', ru: 'Распространённое выражение в учреждениях',
      ku: 'Gotineke berbelav di saziyan de',
    },
    options: [
      'Jemanden informieren',
      'Eine Entscheidung ablehnen',
      'Einen Brief schreiben',
      'Einen Fehler machen',
    ],
    correct: 0,
  },
  // B1 — Audio
  {
    id: 11, type: 'audio', level: 'B1',
    audioText: 'Aufgrund fehlender Unterlagen kann Ihr Antrag derzeit nicht bearbeitet werden.',
    questionByLang: {
      ar: 'ما المشكلة مع الطلب؟', uk: 'Яка проблема із заявою?', es: '¿Cuál es el problema con la solicitud?', en: 'What is the problem with the application?',
      de: 'Was ist das Problem mit dem Antrag?', tr: 'Başvuruyla ilgili sorun nedir?', pl: 'Jaki jest problem z wnioskiem?', ro: 'Care este problema cu cererea?', ru: 'В чём проблема с заявлением?',
      ku: 'Pirsgirêka serîlêdanê çi ye?',
    },
    optionsByLang: {
      ar: ['التقديم لا يمكن معالجته بسبب نقص المستندات', 'تم قبول الطلب بنجاح', 'الطلب في المراجعة', 'الطلب مرفوض بسبب الخطأ'],
      uk: ['Заяву не можна обробити через відсутність документів', 'Заяву успішно прийнято', 'Заява на розгляді', 'Заяву відхилено через помилку'],
      es: ['La solicitud no puede tramitarse por falta de documentos', 'La solicitud fue aceptada con éxito', 'La solicitud está en revisión', 'La solicitud fue rechazada por un error'],
      en: ['The application cannot be processed due to missing documents', 'The application was accepted successfully', 'The application is under review', 'The application was rejected due to an error'],
      de: ['Der Antrag kann wegen fehlender Unterlagen nicht bearbeitet werden', 'Der Antrag wurde erfolgreich angenommen', 'Der Antrag wird geprüft', 'Der Antrag wurde wegen eines Fehlers abgelehnt'],
      tr: ['Eksik belgeler nedeniyle başvuru işlenemiyor', 'Başvuru başarıyla kabul edildi', 'Başvuru inceleniyor', 'Başvuru hata nedeniyle reddedildi'],
      pl: ['Wniosek nie może być przetworzony z powodu brakujących dokumentów', 'Wniosek został pomyślnie przyjęty', 'Wniosek jest w trakcie rozpatrywania', 'Wniosek odrzucony z powodu błędu'],
      ro: ['Cererea nu poate fi procesată din cauza documentelor lipsă', 'Cererea a fost acceptată cu succes', 'Cererea este în curs de analiză', 'Cererea a fost respinsă din cauza unei erori'],
      ru: ['Заявление не может быть обработано из-за отсутствия документов', 'Заявление успешно принято', 'Заявление на рассмотрении', 'Заявление отклонено из-за ошибки'],
      ku: ['Serîlêdan ji ber kêmasiya belgeyan nayê pêvajokirin', 'Serîlêdan bi serkeftî hat qebûlkirin', 'Serîlêdan tê venihêrtin', 'Serîlêdan ji ber çewtiyekê hat redkirin'],
    },
  },
  {
    id: 12, type: 'audio', level: 'B1',
    audioText: 'Sie haben das Recht, gegen diesen Bescheid innerhalb von vier Wochen Widerspruch einzulegen.',
    questionByLang: {
      ar: 'ما الذي يمكن للشخص فعله؟', uk: 'Що може зробити людина?', es: '¿Qué puede hacer la persona?', en: 'What can the person do?',
      de: 'Was kann die Person tun?', tr: 'Kişi ne yapabilir?', pl: 'Co może zrobić ta osoba?', ro: 'Ce poate face persoana?', ru: 'Что может сделать человек?',
      ku: 'Kes dikare çi bike?',
    },
    optionsByLang: {
      ar: ['تقديم اعتراض على القرار خلال أربعة أسابيع', 'دفع الغرامة فوراً', 'قبول القرار دون اعتراض', 'التقدم لإعادة التقييم في غضون سنة'],
      uk: ['Подати заперечення на рішення протягом чотирьох тижнів', 'Негайно оплатити штраф', 'Прийняти рішення без заперечення', 'Подати на перегляд протягом року'],
      es: ['Presentar un recurso contra la resolución en cuatro semanas', 'Pagar la multa inmediatamente', 'Aceptar la resolución sin recurso', 'Solicitar revisión en un año'],
      en: ['File an objection against the decision within four weeks', 'Pay the fine immediately', 'Accept the decision without objection', 'Apply for review within a year'],
      de: ['Widerspruch gegen den Bescheid innerhalb von vier Wochen einlegen', 'Sofort eine Strafe zahlen', 'Den Bescheid ohne Widerspruch akzeptieren', 'Innerhalb eines Jahres eine Überprüfung beantragen'],
      tr: ['Dört hafta içinde karara itiraz etmek', 'Cezayı hemen ödemek', 'Kararı itiraz etmeden kabul etmek', 'Bir yıl içinde yeniden değerlendirme talep etmek'],
      pl: ['Złożyć odwołanie od decyzji w ciągu czterech tygodni', 'Natychmiast zapłacić karę', 'Zaakceptować decyzję bez sprzeciwu', 'Złożyć wniosek o kontrolę w ciągu roku'],
      ro: ['Depune o contestație împotriva deciziei în patru săptămâni', 'Plătiți amenda imediat', 'Acceptați decizia fără contestație', 'Solicitați revizuire în decurs de un an'],
      ru: ['Подать возражение против решения в течение четырёх недель', 'Немедленно оплатить штраф', 'Принять решение без возражений', 'Подать на пересмотр в течение года'],
      ku: ['Di nav çar hefteyan de li dijî biryarê îtiraz bike', 'Cezayê tavilê bide', 'Biryarê bê îtiraz qebûl bike', 'Di nav salekê de daxwaza venihêrtinê bike'],
    },
  },
  {
    id: 13, type: 'audio', level: 'B1',
    audioText: 'Für die Beantragung der Aufenthaltserlaubnis benötigen Sie einen gültigen Reisepass und eine aktuelle Meldebescheinigung.',
    questionByLang: {
      ar: 'ماذا تحتاج للحصول على تصريح الإقامة؟', uk: 'Що потрібно для отримання дозволу на проживання?', es: '¿Qué se necesita para el permiso de residencia?', en: 'What do you need for the residence permit?',
      de: 'Was braucht man für die Aufenthaltserlaubnis?', tr: 'Oturma izni için ne gerekli?', pl: 'Co potrzeba do pozwolenia na pobyt?', ro: 'Ce trebuie pentru permisul de ședere?', ru: 'Что нужно для разрешения на проживание?',
      ku: 'Ji bo destûra mayînê çi pêwîst e?',
    },
    optionsByLang: {
      ar: ['جواز سفر ساري وشهادة تسجيل حديثة', 'عقد عمل وكشف حساب بنكي', 'شهادة ميلاد وشهادة مدرسية', 'تأمين صحي وعقد إيجار'],
      uk: ['Дійсний паспорт та актуальна довідка про реєстрацію', 'Трудовий договір та банківська виписка', 'Свідоцтво про народження та шкільний атестат', 'Медична страховка та договір оренди'],
      es: ['Pasaporte válido y certificado de empadronamiento actualizado', 'Contrato de trabajo y extracto bancario', 'Partida de nacimiento y diploma escolar', 'Seguro médico y contrato de alquiler'],
      en: ['Valid passport and current registration certificate', 'Employment contract and bank statement', 'Birth certificate and school diploma', 'Health insurance and rental contract'],
      de: ['Gültiger Reisepass und aktuelle Meldebescheinigung', 'Arbeitsvertrag und Kontoauszug', 'Geburtsurkunde und Schulzeugnis', 'Krankenversicherung und Mietvertrag'],
      tr: ['Geçerli pasaport ve güncel ikamet belgesi', 'İş sözleşmesi ve banka ekstresi', 'Doğum belgesi ve okul diploması', 'Sağlık sigortası ve kira sözleşmesi'],
      pl: ['Ważny paszport i aktualne zaświadczenie o zameldowaniu', 'Umowa o pracę i wyciąg bankowy', 'Akt urodzenia i świadectwo szkolne', 'Ubezpieczenie zdrowotne i umowa najmu'],
      ro: ['Pașaport valabil și adeverință de domiciliu actuală', 'Contract de muncă și extras de cont bancar', 'Certificat de naștere și diplomă școlară', 'Asigurare medicală și contract de închiriere'],
      ru: ['Действительный паспорт и актуальная справка о регистрации', 'Трудовой договор и банковская выписка', 'Свидетельство о рождении и школьный диплом', 'Медицинская страховка и договор аренды'],
      ku: ['Pasaporteke derbasdar û belgeya tomarkirinê ya niha', 'Peymana kar û rûpela hesabê bankê', 'Belgeya jidayikbûnê û diplomaya dibistanê', 'Sîgorteya tenduristiyê û peymana kirêdarî'],
    },
  },
  // B1 — Choice
  {
    id: 14, type: 'choice', level: 'B1',
    questionDE: 'Welche Formulierung ist korrekt?',
    hintByLang: {
      ar: 'اختر الجملة الصحيحة نحوياً', uk: 'Обери граматично правильне речення', es: 'Elige la oración gramaticalmente correcta', en: 'Choose the grammatically correct sentence',
      de: 'Wähle den grammatisch korrekten Satz', tr: 'Dilbilgisi açısından doğru cümleyi seçin', pl: 'Wybierz gramatycznie poprawne zdanie', ro: 'Alegeți propoziția corectă din punct de vedere gramatical', ru: 'Выберите грамматически правильное предложение',
      ku: 'Hevoka ji aliyê rêzimanî ve rast hilbijêre',
    },
    options: [
      'Ich habe gestern beim Jobcenter angerufen.',
      'Ich angerufen habe gestern beim Jobcenter.',
      'Gestern ich habe beim Jobcenter angerufen.',
      'Beim Jobcenter angerufen ich habe gestern.',
    ],
    correct: 0,
  },
  {
    id: 15, type: 'choice', level: 'B1',
    questionDE: 'Was bedeutet "etw. beantragen"?',
    hintByLang: {
      ar: 'مصطلح إداري مهم جداً', uk: 'Важливий адміністративний термін', es: 'Término administrativo muy importante', en: 'A very important administrative term',
      de: 'Ein sehr wichtiger Verwaltungsbegriff', tr: 'Çok önemli bir idari terim', pl: 'Bardzo ważny termin administracyjny', ro: 'Un termen administrativ foarte important', ru: 'Очень важный административный термин',
      ku: 'Têgeheke îdarî ya pir girîng',
    },
    options: [
      'Offiziell um etwas bitten (z.B. Aufenthaltserlaubnis)',
      'Etwas ablehnen oder verweigern',
      'Etwas bezahlen oder überweisen',
      'Etwas unterschreiben und bestätigen',
    ],
    correct: 0,
  },
];

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleWithCorrect(options: string[], correctIdx: number) {
  const pairs = options.map((o, i) => ({ o, isCorrect: i === correctIdx }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return { options: pairs.map(p => p.o), correct: pairs.findIndex(p => p.isCorrect) };
}

interface DisplayQuestion {
  id: number;
  type: 'audio' | 'choice';
  level: 'A1' | 'A2' | 'B1' | 'B2';
  audioText?: string;  // für type=audio: wird via TTS gespielt, text versteckt
  questionLine: string;
  hintLine?: string;
  options: string[];
  correct: number;
}

function buildDisplayQuestions(lang: Language): DisplayQuestion[] {
  return shuffle(QUESTIONS).map(q => {
    if (q.type === 'audio') {
      const { options, correct } = shuffleWithCorrect(q.optionsByLang[lang] ?? q.optionsByLang['en'], 0);
      return {
        id: q.id, type: 'audio' as const, level: q.level,
        audioText: q.audioText,
        questionLine: q.questionByLang[lang] ?? q.questionByLang['en'],
        options, correct,
      };
    } else {
      const { options, correct } = shuffleWithCorrect(q.options, q.correct);
      return {
        id: q.id, type: 'choice' as const, level: q.level,
        questionLine: q.questionDE,
        hintLine: q.hintByLang[lang] ?? q.hintByLang['en'],
        options, correct,
      };
    }
  });
}

function computeLevel(qs: DisplayQuestion[], answers: (number | null)[]): Level {
  let a1 = 0, a2 = 0, b1 = 0;
  qs.forEach((q, i) => {
    if (answers[i] === q.correct) {
      if (q.level === 'A1') a1++;
      else if (q.level === 'A2') a2++;
      else if (q.level === 'B1') b1++;
    }
  });
  const total = a1 + a2 + b1;
  if (total >= 11 && b1 >= 3) return 'B2';
  if (total >= 7 && b1 >= 2) return 'B1';
  if (total >= 4 && a2 >= 1) return 'A2';
  return 'A1';
}

const TIMER_SECS = 25;

// ── Timer-Ring (SVG) ─────────────────────────────────────────────────────────

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = remaining / total;
  const dash = pct * circ;
  const color = remaining <= 5 ? '#ef4444' : remaining <= 10 ? '#4f46e5' : '#10b981';

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="absolute" width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={3} />
        <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }} />
      </svg>
      <span className="text-sm font-bold font-mono relative z-10" style={{ color }}>
        {remaining}
      </span>
    </div>
  );
}

// ── Ergebnis-Screen ──────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  A1: '#10b981', A2: '#3b82f6', B1: '#8b5cf6', B2: '#4f46e5',
};

const RESULT_MSG: Record<string, Partial<Record<Language, { title: string; text: string }>>> = {
  A1: {
    en: { title: 'Level A1 — Beginner', text: 'Great start! We\'ll build a strong foundation in German together.' },
    ar: { title: 'المستوى A1 — مبتدئ', text: 'بداية رائعة! سنبني أساساً قوياً معاً في اللغة الألمانية.' },
    uk: { title: 'Рівень A1 — Початківець', text: 'Чудовий початок! Разом побудуємо міцну основу в німецькій.' },
    es: { title: 'Nivel A1 — Principiante', text: '¡Buen comienzo! Juntos construiremos una base sólida en alemán.' },
    tr: { title: 'A1 Seviyesi — Başlangıç', text: 'Harika bir başlangıç! Birlikte Almancada güçlü bir temel oluşturacağız.' },
    de: { title: 'Niveau A1 — Anfänger', text: 'Guter Start! Wir bauen gemeinsam eine starke Grundlage.' },
    ru: { title: 'Уровень A1 — Начинающий', text: 'Хорошее начало! Вместе построим прочную основу в немецком.' },
    pl: { title: 'Poziom A1 — Początkujący', text: 'Dobry start! Razem zbudujemy solidną podstawę w języku niemieckim.' },
    ro: { title: 'Nivelul A1 — Începător', text: 'Start bun! Împreună vom construi o bază solidă în germană.' },
  },
  A2: {
    en: { title: 'Level A2 — Elementary', text: 'Good foundation! We\'ll expand your practical vocabulary.' },
    ar: { title: 'المستوى A2 — مبتدئ متقدم', text: 'أساس جيد! سنوسّع مفرداتك العملية.' },
    uk: { title: 'Рівень A2 — Елементарний', text: 'Гарна основа! Розширимо практичний словник.' },
    es: { title: 'Nivel A2 — Elemental', text: '¡Buena base! Ampliaremos tu vocabulario práctico.' },
    tr: { title: 'A2 Seviyesi — Temel', text: 'İyi bir temel! Pratik kelime dağarcığını genişleteceğiz.' },
    de: { title: 'Niveau A2 — Grundkenntnisse', text: 'Gute Grundlage! Wir erweitern deinen praktischen Wortschatz.' },
    ru: { title: 'Уровень A2 — Элементарный', text: 'Хорошая основа! Расширим практическую лексику.' },
    pl: { title: 'Poziom A2 — Podstawowy', text: 'Dobra podstawa! Rozbudujemy praktyczne słownictwo.' },
    ro: { title: 'Nivelul A2 — Elementar', text: 'Bază bună! Vom extinde vocabularul practic.' },
  },
  B1: {
    en: { title: 'Level B1 — Intermediate', text: 'Impressive! We\'ll challenge you with more complex conversations.' },
    ar: { title: 'المستوى B1 — متوسط', text: 'مثير للإعجاب! سنتحداك بمحادثات أكثر تعقيداً.' },
    uk: { title: 'Рівень B1 — Середній', text: 'Вражає! Складніші розмови чекають.' },
    es: { title: 'Nivel B1 — Intermedio', text: '¡Impresionante! Te desafiaremos con conversaciones más complejas.' },
    tr: { title: 'B1 Seviyesi — Orta', text: 'Etkileyici! Daha karmaşık konuşmalarla sizi zorlayacağız.' },
    de: { title: 'Niveau B1 — Mittelstufe', text: 'Beeindruckend! Wir fordern dich mit komplexeren Gesprächen heraus.' },
    ru: { title: 'Уровень B1 — Средний', text: 'Впечатляет! Вас ждут более сложные разговоры.' },
    pl: { title: 'Poziom B1 — Średnio zaawansowany', text: 'Imponujące! Będziemy wyzywać bardziej złożonymi rozmowami.' },
    ro: { title: 'Nivelul B1 — Intermediar', text: 'Impresionant! Te vom provoca cu conversații mai complexe.' },
  },
  B2: {
    en: { title: 'Level B2 — Advanced', text: 'Excellent! You have strong German skills. We\'ll fine-tune the details.' },
    ar: { title: 'المستوى B2 — متقدم', text: 'ممتاز! مهاراتك في اللغة الألمانية قوية. سنصقل التفاصيل.' },
    uk: { title: 'Рівень B2 — Просунутий', text: 'Відмінно! У вас сильні навички. Відшліфуємо деталі.' },
    es: { title: 'Nivel B2 — Avanzado', text: '¡Excelente! Tu alemán es muy bueno. Puliremos los detalles.' },
    tr: { title: 'B2 Seviyesi — İleri', text: 'Mükemmel! Almanca becerileriniz çok güçlü.' },
    de: { title: 'Niveau B2 — Fortgeschritten', text: 'Ausgezeichnet! Sehr starkes Deutsch. Wir feilen an den Details.' },
    ru: { title: 'Уровень B2 — Продвинутый', text: 'Отлично! Очень сильный немецкий. Доработаем детали.' },
    pl: { title: 'Poziom B2 — Zaawansowany', text: 'Doskonale! Bardzo dobry poziom. Doszlifujemy szczegóły.' },
    ro: { title: 'Nivelul B2 — Avansat', text: 'Excelent! Germana ta este foarte bună. Vom perfecționa detaliile.' },
  },
};

// ── Selbst-Einschätzung für Deutsche ─────────────────────────────────────────

const SELF_LEVELS = [
  { level: 'A1' as Level, label: 'A1 — Anfänger', desc: 'Ich kenne kaum Grundphrasen.' },
  { level: 'A2' as Level, label: 'A2 — Grundkenntnisse', desc: 'Einfache Sätze, bekannte Situationen.' },
  { level: 'B1' as Level, label: 'B1 — Mittelstufe', desc: 'Die meisten Alltagssituationen.' },
  { level: 'B2' as Level, label: 'B2 — Fortgeschritten', desc: 'Fließend, komplexe Texte.' },
];

// ── Haupt-Komponente ─────────────────────────────────────────────────────────

export function Step3Assessment() {
  const navigate = useNavigate();
  const { completeOnboarding, progress } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const isGerman = lang === 'de';

  const [questions] = useState<DisplayQuestion[]>(() => buildDisplayQuestions(lang));
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [remaining, setRemaining] = useState(TIMER_SECS);
  const [timedOut, setTimedOut] = useState(false);
  const [result, setResult] = useState<Level | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const question = questions[current];

  // ── Audio abspielen ────────────────────────────────────────────
  const playAudio = useCallback(async () => {
    if (!question.audioText) return;
    setAudioLoading(true);
    setAudioError(false);
    try {
      const audio = await ttsSpeak(question.audioText, 0.85);
      audioRef.current = audio;
      await audio.play();
    } catch {
      setAudioError(true);
    } finally {
      setAudioLoading(false);
    }
  }, [question]);

  // Auto-play wenn neue Frage geladen
  useEffect(() => {
    if (question.type === 'audio' && !selected && !timedOut) {
      setAudioError(false);
      playAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // ── Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (selected !== null || timedOut || result !== null) return;
    setRemaining(TIMER_SECS);
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current!);
          setTimedOut(true);
          setRevealed(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, result]);

  // ── Antwort auswählen ──────────────────────────────────────────
  const handleSelect = (idx: number) => {
    if (selected !== null || timedOut) return;
    clearInterval(timerRef.current!);
    setSelected(idx);
    setRevealed(true);

    setTimeout(() => {
      advance(idx);
    }, 900);
  };

  const handleTimeout = () => {
    const newAnswers = [...answers, null];
    if (current < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
      setSelected(null);
      setTimedOut(false);
      setRevealed(false);
    } else {
      finalise(newAnswers);
    }
  };

  const advance = (chosenIdx: number) => {
    const newAnswers = [...answers, chosenIdx];
    if (current < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
      setSelected(null);
      setTimedOut(false);
      setRevealed(false);
    } else {
      finalise(newAnswers);
    }
  };

  const finalise = (finalAnswers: (number | null)[]) => {
    const level = computeLevel(questions, finalAnswers);
    const score = finalAnswers.filter((a, i) => a === questions[i].correct).length;
    setAnswers(finalAnswers);
    setResult(level);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const assessment = {
      sessionId: sessionId.current,
      level,
      score,
      total: questions.length,
      durationSec: duration,
      answers: finalAnswers.map((a, i) => ({
        questionId: questions[i].id,
        chosen: a,
        correct: questions[i].correct,
        ok: a === questions[i].correct,
      })),
    };

    if (getWidCode()) {
      void trackAssessment(assessment);
    } else {
      fetch('/api/assessment/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...assessment, duration }),
      }).catch(() => { /* ignorieren */ });
    }
    // Rate-Limit: nächster Test frühestens in 4 Stunden
    try { localStorage.setItem('linguu_last_assessment', String(Date.now())); } catch { /* */ }
  };

  // ── Selbst-Einschätzung für Deutsche ──────────────────────────
  if (isGerman) {
    return (
      <OnboardingLayout step={4} total={4} onBack={() => navigate('/onboarding/2')}>
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a' }}>
            Dein Sprachniveau?
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Wir passen die Inhalte auf dein Niveau an.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {SELF_LEVELS.map(({ level, label, desc }) => (
            <button key={level}
              onClick={() => { completeOnboarding(level); navigate('/'); }}
              className="flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.9)', border: `2px solid ${LEVEL_COLORS[level]}30` }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = LEVEL_COLORS[level];
                (e.currentTarget as HTMLElement).style.background = `${LEVEL_COLORS[level]}12`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${LEVEL_COLORS[level]}30`;
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: `${LEVEL_COLORS[level]}20`, color: LEVEL_COLORS[level], border: `2px solid ${LEVEL_COLORS[level]}50` }}>
                {level}
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold" style={{ color: '#0f172a' }}>{label}</div>
                <div className="text-sm mt-0.5" style={{ color: '#64748b' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </OnboardingLayout>
    );
  }

  // ── Ergebnis-Screen ────────────────────────────────────────────
  if (result !== null) {
    const score = answers.filter((a, i) => a === questions[i].correct).length;
    const msg = RESULT_MSG[result]?.[lang] ?? RESULT_MSG[result]?.['en']!;
    const color = LEVEL_COLORS[result];
    return (
      <OnboardingLayout step={4} total={4} onBack={() => {}}>
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 text-4xl"
            style={{ background: `${color}20`, border: `3px solid ${color}` }}>
            🎉
          </div>
          <h1 className="text-4xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a' }}>{msg.title}</h1>
          <p className="text-lg mb-4 max-w-md mx-auto" style={{ color: '#64748b' }}>{msg.text}</p>
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full mb-8 font-bold"
            style={{ background: `${color}15`, border: `2px solid ${color}`, color }}>
            <span className="text-2xl">{result}</span>
            <span className="text-sm font-mono">{score}/{questions.length}</span>
          </div>
          <br />
          <button
            onClick={() => { completeOnboarding(result); navigate('/'); }}
            className="px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#f8fafc' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            {t('startNow', lang)}
          </button>
        </div>
      </OnboardingLayout>
    );
  }

  // ── Quiz-Screen ────────────────────────────────────────────────
  const isDone = selected !== null || timedOut;
  const isAudio = question.type === 'audio';

  return (
    <OnboardingLayout step={4} total={4} onBack={() => navigate('/onboarding/2')}>
      {/* Header: Fortschritt + Timer */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 7, height: 7,
                background: i < current
                  ? answers[i] === questions[i].correct ? '#10b981' : '#ef4444'
                  : i === current ? '#4f46e5' : 'rgba(0,0,0,0.1)',
              }} />
          ))}
        </div>
        {!isDone
          ? <TimerRing remaining={remaining} total={TIMER_SECS} />
          : <div className="w-14 h-14 flex items-center justify-center">
              <Clock size={18} style={{ color: 'var(--muted)' }} />
            </div>
        }
      </div>

      <div className="rounded-2xl p-6 mb-4"
        style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.06)' }}>

        {/* Level-Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: LEVEL_COLORS[question.level], opacity: 0.9 }}>
            {question.level} · {t('questionOf', lang, String(current + 1), String(questions.length))}
          </span>
          {isAudio && (
            <button onClick={playAudio} disabled={audioLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-opacity"
              style={{ background: audioError ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                       color: audioError ? '#ef4444' : '#6366f1',
                       border: `1px solid ${audioError ? '#ef444440' : '#6366f140'}` }}>
              {audioLoading
                ? <span className="animate-pulse">…</span>
                : audioError
                  ? <><VolumeX size={12} /> Fehler</>
                  : <><Volume2 size={12} /> Nochmal</>}
            </button>
          )}
        </div>

        {/* Frage */}
        <p className="text-lg font-semibold mb-1" style={{ color: '#0f172a' }}>
          {question.questionLine}
        </p>
        {question.hintLine && (
          <p className="text-sm mb-4" style={{ color: '#64748b' }}>{question.hintLine}</p>
        )}

        {/* Audio-Text: versteckt bis zur Antwort */}
        {isAudio && (
          <div className="rounded-lg px-4 py-3 mb-4 text-sm transition-all duration-500"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: revealed ? '#a5b4fc' : 'transparent',
              filter: revealed ? 'none' : 'blur(6px)',
              userSelect: 'none',
            }}>
            {question.audioText}
          </div>
        )}

        {!isAudio && !question.hintLine && <div className="mb-4" />}

        {/* Antwort-Buttons */}
        <div className="grid grid-cols-1 gap-2.5 mt-2">
          {question.options.map((option, idx) => {
            let bg = 'rgba(0,0,0,0.03)';
            let border = 'rgba(0,0,0,0.07)';
            let color = '#0f172a';

            if (isDone) {
              if (idx === question.correct) {
                bg = 'rgba(16,185,129,0.15)'; border = '#10b981'; color = '#10b981';
              } else if (idx === selected && selected !== question.correct) {
                bg = 'rgba(239,68,68,0.15)'; border = '#ef4444'; color = '#ef4444';
              }
            }

            return (
              <button key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isDone}
                className="text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: bg, border: `1px solid ${border}`, color, cursor: isDone ? 'default' : 'pointer' }}
                onMouseEnter={e => {
                  if (!isDone) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(79,70,229,0.5)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(79,70,229,0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isDone) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)';
                  }
                }}>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2.5"
                  style={{ background: 'rgba(0,0,0,0.06)', color: 'inherit', flexShrink: 0 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeout-Meldung + Weiter */}
      {timedOut && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl animate-fade-in-up"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-sm" style={{ color: '#fca5a5' }}>
            ⏱ Zeit abgelaufen — die richtige Antwort ist <strong style={{ color: '#10b981' }}>
              {String.fromCharCode(65 + question.correct)}
            </strong>
          </p>
          <button onClick={handleTimeout}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            Weiter <ChevronRight size={14} />
          </button>
        </div>
      )}
    </OnboardingLayout>
  );
}
