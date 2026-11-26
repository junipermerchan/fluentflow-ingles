/* ==========================================================================
   FluentFlow — Entrenamiento Completo para Aprender Inglés (SRS + Active Recall)
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'fluentflow_en_v1';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function showToast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // -------------------- NATIVE NEURAL SPEECH ENGINE --------------------
  let currentAudio = null;
  let neuralAvailable = false;
  const audioBlobCache = new Map();

  async function detectNeuralServer() {
    try {
      const resp = await fetch('/api/tts/status', { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        neuralAvailable = Boolean(data.neural);
      }
    } catch {
      neuralAvailable = false;
    }
    const pill = $('#voice-engine-pill');
    if (pill) {
      pill.textContent = neuralAvailable ? '✨ Neural HD' : 'Navegador';
    }
  }

  function stopSpeaking() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function speakFallbackBrowser(text, rate = 1.0) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const langPrefix = (state.voice || 'en-US-AvaNeural').slice(0, 5);
    u.lang = langPrefix;
    u.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    // Prefer natural / online / Google voices over robotic SAPI voices
    const preferred =
      voices.find((v) => v.lang.startsWith(langPrefix) && /natural|neural|google/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith(langPrefix)) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }

  async function speakEnglish(text, rate = 1.0) {
    if (!text) return;
    stopSpeaking();

    const voice = state.voice || 'en-US-AvaNeural';
    if (neuralAvailable) {
      const cacheKey = `${voice}|${rate}|${text}`;
      try {
        let blobUrl = audioBlobCache.get(cacheKey);
        if (!blobUrl) {
          const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&rate=${encodeURIComponent(rate)}`;
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('TTS request failed');
          const blob = await resp.blob();
          blobUrl = URL.createObjectURL(blob);
          audioBlobCache.set(cacheKey, blobUrl);
        }
        const audio = new Audio(blobUrl);
        currentAudio = audio;
        await audio.play();
        return;
      } catch {
        // Fall back smoothly if offline or autoplay blocked
      }
    }
    speakFallbackBrowser(text, rate);
  }

  // -------------------- CONTENT DATASETS --------------------
  const BASE_VOCAB = [
    // A1-A2
    { id: 'v1', en: 'actually', es: 'en realidad / de hecho', ph: '/ˈæk.tʃu.ə.li/', ex: 'I actually prefer coffee in the morning.', exEs: 'En realidad prefiero café por la mañana.', lvl: 'A1-A2' },
    { id: 'v2', en: 'improve', es: 'mejorar', ph: '/ɪmˈpruːv/', ex: 'Daily practice will improve your fluency.', exEs: 'La práctica diaria mejorará tu fluidez.', lvl: 'A1-A2' },
    { id: 'v3', en: 'schedule', es: 'horario / agenda', ph: '/ˈskedʒ.uːl/', ex: 'Let me check my schedule for tomorrow.', exEs: 'Déjame revisar mi agenda para mañana.', lvl: 'A1-A2' },
    { id: 'v4', en: 'available', es: 'disponible', ph: '/əˈveɪ.lə.bəl/', ex: 'Are you available for a quick call?', exEs: '¿Estás disponible para una llamada rápida?', lvl: 'A1-A2' },
    { id: 'v5', en: 'instead of', es: 'en lugar de', ph: '/ɪnˈsted əv/', ex: 'Drink water instead of soda.', exEs: 'Toma agua en lugar de refresco.', lvl: 'A1-A2' },
    { id: 'v6', en: 'borrow', es: 'pedir prestado', ph: '/ˈbɒr.oʊ/', ex: 'Can I borrow your charger for a minute?', exEs: '¿Puedo pedirte prestado tu cargador un minuto?', lvl: 'A1-A2' },
    { id: 'v7', en: 'habit', es: 'hábito', ph: '/ˈhæb.ɪt/', ex: 'Reading every night is a great habit.', exEs: 'Leer cada noche es un gran hábito.', lvl: 'A1-A2' },
    { id: 'v8', en: 'enough', es: 'suficiente', ph: '/ɪˈnʌf/', ex: 'We have enough time to finish the project.', exEs: 'Tenemos suficiente tiempo para terminar el proyecto.', lvl: 'A1-A2' },
    { id: 'v9', en: 'although', es: 'aunque', ph: '/ɔːlˈðoʊ/', ex: 'Although it rained, we enjoyed the trip.', exEs: 'Aunque llovió, disfrutamos el viaje.', lvl: 'A1-A2' },
    { id: 'v10', en: 'purpose', es: 'propósito / objetivo', ph: '/ˈpɜːr.pəs/', ex: 'What is the purpose of this meeting?', exEs: '¿Cuál es el propósito de esta reunión?', lvl: 'A1-A2' },
    // B1
    { id: 'v11', en: 'figure out', es: 'descifrar / resolver / entender', ph: '/ˈfɪɡ.jər aʊt/', ex: 'I need to figure out how this system works.', exEs: 'Necesito entender cómo funciona este sistema.', lvl: 'B1' },
    { id: 'v12', en: 'reliable', es: 'confiable / fiable', ph: '/rɪˈlaɪ.ə.bəl/', ex: 'She is the most reliable person on the team.', exEs: 'Ella es la persona más confiable del equipo.', lvl: 'B1' },
    { id: 'v13', en: 'achieve', es: 'lograr / alcanzar', ph: '/əˈtʃiːv/', ex: 'Small steps help you achieve big goals.', exEs: 'Los pequeños pasos te ayudan a lograr grandes metas.', lvl: 'B1' },
    { id: 'v14', en: 'struggle', es: 'luchar / costar trabajo', ph: '/ˈstrʌɡ.əl/', ex: 'Many learners struggle with fast listening.', exEs: 'A muchos estudiantes les cuesta la escucha rápida.', lvl: 'B1' },
    { id: 'v15', en: 'look forward to', es: 'esperar con ilusión', ph: '/lʊk ˈfɔːr.wərd tuː/', ex: 'I look forward to hearing from you soon.', exEs: 'Espero con ilusión saber de ti pronto.', lvl: 'B1' },
    { id: 'v16', en: 'consistent', es: 'constante / consistente', ph: '/kənˈsɪs.tənt/', ex: 'Being consistent matters more than perfection.', exEs: 'Ser constante importa más que la perfección.', lvl: 'B1' },
    { id: 'v17', en: 'postpone', es: 'posponer / aplazar', ph: '/poʊstˈpoʊn/', ex: 'They had to postpone the launch until Monday.', exEs: 'Tuvieron que posponer el lanzamiento hasta el lunes.', lvl: 'B1' },
    { id: 'v18', en: 'worthwhile', es: 'que vale la pena', ph: '/ˌwɜːrθˈwaɪl/', ex: 'Learning another language is always worthwhile.', exEs: 'Aprender otro idioma siempre vale la pena.', lvl: 'B1' },
    // B2-C1
    { id: 'v19', en: 'breakthrough', es: 'gran avance / descubrimiento', ph: '/ˈbreɪk.θruː/', ex: 'Active recall was a breakthrough in my studies.', exEs: 'El recuerdo activo fue un gran avance en mis estudios.', lvl: 'B2-C1' },
    { id: 'v20', en: 'overwhelming', es: 'abrumador', ph: '/ˌoʊ.vərˈwel.mɪŋ/', ex: 'At first, native podcasts can feel overwhelming.', exEs: 'Al principio, los podcasts nativos pueden parecer abrumadores.', lvl: 'B2-C1' },
    { id: 'v21', en: 'pull off', es: 'lograr algo difícil', ph: '/pʊl ɒf/', ex: 'I cannot believe we pulled off the presentation.', exEs: 'No puedo creer que hayamos sacado adelante la presentación.', lvl: 'B2-C1' },
    { id: 'v22', en: 'nevertheless', es: 'sin embargo / no obstante', ph: '/ˌnev.ər.ðəˈles/', ex: 'The task was tough; nevertheless, he kept going.', exEs: 'La tarea era dura; sin embargo, él siguió adelante.', lvl: 'B2-C1' },
    { id: 'v23', en: 'take for granted', es: 'dar por sentado', ph: '/teɪk fɔːr ˈɡræn.tɪd/', ex: 'Do not take good sleep for granted.', exEs: 'No des por sentado un buen descanso.', lvl: 'B2-C1' },
    { id: 'v24', en: 'streamline', es: 'optimizar / agilizar', ph: '/ˈstriːm.laɪn/', ex: 'We should streamline our daily workflow.', exEs: 'Deberíamos agilizar nuestro flujo de trabajo diario.', lvl: 'B2-C1' },
  ];

  const READINGS = [
    {
      id: 'r1',
      level: 'A1-A2',
      title: 'The Power of Fifteen Minutes',
      text: 'Many people believe they need two hours every day to learn English. However, short daily sessions often work much better. When you study for fifteen focused minutes every morning, your brain builds a strong habit. You remember more words because you review them regularly instead of cramming once a week.',
      translation: 'Muchas personas creen que necesitan dos horas cada día para aprender inglés. Sin embargo, las sesiones diarias cortas suelen funcionar mucho mejor. Cuando estudias quince minutos enfocados cada mañana, tu cerebro construye un hábito sólido. Recuerdas más palabras porque las repasas regularmente en lugar de atiborrarte una vez a la semana.',
      vocab: ['however = sin embargo', 'focused = enfocado', 'instead of = en lugar de', 'cramming = estudiar todo de golpe'],
      questions: [
        { q: 'What do many people wrongly believe about learning English?', opts: ['That they need two hours every day', 'That English has no grammar', 'That reading is useless'], ans: 0 },
        { q: 'Why do short daily sessions work better?', opts: ['Because you never need to review', 'Because your brain builds a strong habit and reviews regularly', 'Because they replace speaking'], ans: 1 },
        { q: 'What should you avoid according to the text?', opts: ['Studying in the morning', 'Cramming once a week', 'Learning new words'], ans: 1 },
      ],
    },
    {
      id: 'r2',
      level: 'A2',
      title: 'Ordering Coffee Like a Local',
      text: 'Last Tuesday, Elena visited a small café in Seattle. She used to feel nervous when speaking English with strangers. This time, she smiled and asked politely: "Could I get an iced oat latte to go, please?" The barista understood her immediately and asked if she wanted any syrup. Elena replied, "No thanks, just as it is." Walking out with her coffee, she realized that confidence grows through real conversations.',
      translation: 'El martes pasado, Elena visitó una pequeña cafetería en Seattle. Solía sentirse nerviosa al hablar inglés con desconocidos. Esta vez, sonrió y preguntó amablemente: "¿Podría darme un latte helado con leche de avena para llevar, por favor?". El barista la entendió de inmediato y le preguntó si quería algún jarabe. Elena respondió: "No gracias, así tal cual". Al salir con su café, se dio cuenta de que la confianza crece mediante conversaciones reales.',
      vocab: ['used to = solía', 'to go = para llevar', 'just as it is = así tal cual', 'realized = se dio cuenta'],
      questions: [
        { q: 'How did Elena use to feel when speaking with strangers?', opts: ['Bored', 'Nervous', 'Angry'], ans: 1 },
        { q: 'What did Elena order?', opts: ['A hot green tea', 'An iced oat latte to go', 'A double espresso with syrup'], ans: 1 },
        { q: 'What lesson did Elena learn at the end?', opts: ['Confidence grows through real conversations', 'Coffee is cheaper in Seattle', 'You must memorize a dictionary first'], ans: 0 },
      ],
    },
    {
      id: 'r3',
      level: 'B1',
      title: 'Why Active Recall Beats Re-reading',
      text: 'When students highlight a textbook and read it three times, they often feel familiar with the material. Unfortunately, familiarity is not the same as mastery. Cognitive scientists have shown that active recall—closing the book and forcing your brain to retrieve the information—creates much stronger neural pathways. Even when you struggle to remember an answer, that mental effort signals to your brain that the memory is important.',
      translation: 'Cuando los estudiantes subrayan un libro de texto y lo leen tres veces, suelen sentirse familiarizados con el material. Lamentablemente, la familiaridad no es lo mismo que el dominio. Los científicos cognitivos han demostrado que el recuerdo activo —cerrar el libro y obligar a tu cerebro a recuperar la información— crea conexiones neuronales mucho más fuertes. Incluso cuando te cuesta recordar una respuesta, ese esfuerzo mental le indica a tu cerebro que el recuerdo es importante.',
      vocab: ['highlight = subrayar', 'mastery = dominio', 'retrieve = recuperar', 'struggle = costar esfuerzo'],
      questions: [
        { q: 'What is the trap of re-reading and highlighting?', opts: ['It confuses familiarity with true mastery', 'It takes no time at all', 'It improves pronunciation'], ans: 0 },
        { q: 'What does active recall require you to do?', opts: ['Read faster without stopping', 'Close the material and retrieve information from memory', 'Translate every word into Spanish'], ans: 1 },
        { q: 'Why is struggling to remember actually helpful?', opts: ['It proves you should quit', 'It signals to your brain that the memory matters', 'It reduces sleep quality'], ans: 1 },
      ],
    },
    {
      id: 'r4',
      level: 'B1-B2',
      title: 'Working Remotely Across Time Zones',
      text: 'Remote teams allow companies to hire talented professionals from around the globe. Nevertheless, collaborating across different time zones requires clear written communication. Instead of scheduling endless meetings, effective remote teams document decisions carefully and share short video updates. This approach respects everyone’s deep work hours while keeping projects moving smoothly.',
      translation: 'Los equipos remotos permiten a las empresas contratar profesionales talentosos de todo el mundo. Sin embargo, colaborar entre distintas zonas horarias requiere una comunicación escrita clara. En lugar de programar reuniones interminables, los equipos remotos eficaces documentan las decisiones con cuidado y comparten breves actualizaciones en video. Este enfoque respeta las horas de trabajo profundo de todos mientras mantiene los proyectos avanzando sin problemas.',
      vocab: ['nevertheless = sin embargo', 'endless = interminables', 'approach = enfoque', 'smoothly = sin problemas'],
      questions: [
        { q: 'What is essential when collaborating across time zones?', opts: ['Endless daily meetings', 'Clear written communication', 'Working 14 hours a day'], ans: 1 },
        { q: 'What do effective remote teams use instead of too many meetings?', opts: ['Careful documentation and short video updates', 'Phone calls at midnight', 'No communication at all'], ans: 0 },
        { q: 'What benefit does this approach protect?', opts: ['Free office snacks', 'Everyone’s deep work hours', 'Longer commutes'], ans: 1 },
      ],
    },
  ];

  const LISTENING_BANK = {
    'A1-A2': [
      { en: 'I usually wake up at seven in the morning', es: 'Normalmente me despierto a las siete de la mañana' },
      { en: 'Could you speak a little slower please', es: '¿Podrías hablar un poco más despacio por favor?' },
      { en: 'We are going to practice English every day', es: 'Vamos a practicar inglés todos los días' },
      { en: 'She bought a new notebook for her classes', es: 'Ella compró un cuaderno nuevo para sus clases' },
      { en: 'What time does the train leave tonight', es: '¿A qué hora sale el tren esta noche?' },
      { en: 'I really enjoy learning new expressions', es: 'Realmente disfruto aprender nuevas expresiones' },
    ],
    'B1': [
      { en: 'I have been studying English for six months', es: 'He estado estudiando inglés durante seis meses' },
      { en: 'If we leave early we will avoid the traffic', es: 'Si salimos temprano evitaremos el tráfico' },
      { en: 'It took me a while to figure out the answer', es: 'Me tomó un tiempo descifrar la respuesta' },
      { en: 'I look forward to meeting your team next week', es: 'Espero con ilusión conocer a tu equipo la próxima semana' },
      { en: 'Consistency is much more important than speed', es: 'La constancia es mucho más importante que la velocidad' },
      { en: 'She decided to postpone the meeting until Friday', es: 'Ella decidió posponer la reunión hasta el viernes' },
    ],
    'B2-C1': [
      { en: 'We should not take our health for granted', es: 'No deberíamos dar por sentada nuestra salud' },
      { en: 'Despite the tight deadline they pulled it off', es: 'A pesar del plazo ajustado lograron sacarlo adelante' },
      { en: 'Active recall led to a major breakthrough in retention', es: 'El recuerdo activo llevó a un gran avance en la retención' },
      { en: 'Streamlining the process saved us hours every week', es: 'Agilizar el proceso nos ahorró horas cada semana' },
      { en: 'The instructions seemed overwhelming at first glance', es: 'Las instrucciones parecían abrumadoras a primera vista' },
      { en: 'Nevertheless we managed to deliver the project on time', es: 'Sin embargo logramos entregar el proyecto a tiempo' },
    ],
  };

  const BUILDER_BANK = {
    'A1-A2': [
      { tag: 'Pregunta en Presente Simple', es: '¿Con qué frecuencia practicas inglés?', en: 'How often do you practice English', note: 'Usa "How often + do/does + sujeto + verbo base".' },
      { tag: 'Pasado Simple', es: 'Ayer vi una película sin subtítulos', en: 'Yesterday I watched a movie without subtitles', note: 'El verbo regular "watch" pasa a "watched" en pasado.' },
      { tag: 'Futuro con Going to', es: 'Voy a mejorar mi pronunciación este mes', en: 'I am going to improve my pronunciation this month', note: 'Sujeto + am/is/are + going to + verbo base.' },
      { tag: 'Cortesía (Could)', es: '¿Podrías repetir esa última frase por favor?', en: 'Could you repeat that last sentence please', note: '"Could you..." es la forma natural y educada de pedir algo.' },
      { tag: 'Preferencias', es: 'Prefiero escuchar podcasts en lugar de ver televisión', en: 'I prefer listening to podcasts instead of watching TV', note: 'Después de "instead of" el verbo lleva -ing.' },
    ],
    'B1': [
      { tag: 'Present Perfect', es: 'Ya he terminado mi rutina de estudio hoy', en: 'I have already finished my study routine today', note: '"already" va entre "have/has" y el participio pasado.' },
      { tag: 'Primer Condicional', es: 'Si practicas todos los días notarás resultados rápido', en: 'If you practice every day you will notice results fast', note: 'If + Present Simple, sujeto + will + verbo base.' },
      { tag: 'Phrasal Verb (figure out)', es: 'Necesito entender cómo resolver este problema', en: 'I need to figure out how to solve this problem', note: '"figure out" = resolver / descifrar.' },
      { tag: 'Verbo Modal (should)', es: 'Deberías repetir las frases en voz alta', en: 'You should repeat the sentences out loud', note: '"out loud" significa en voz alta.' },
      { tag: 'Used to (Hábito pasado)', es: 'Antes me sentía nervioso cuando hablaba inglés', en: 'I used to feel nervous when speaking English', note: '"used to + verbo" expresa hábitos o estados del pasado.' },
    ],
    'B2-C1': [
      { tag: 'Segundo Condicional', es: 'Si tuviera más tiempo leería una novela entera', en: 'If I had more time I would read a whole novel', note: 'If + Past Simple, sujeto + would + verbo base.' },
      { tag: 'Conector de contraste', es: 'Aunque el acento era rápido entendí la idea principal', en: 'Although the accent was fast I understood the main idea', note: '"Although" introduce una cláusula completa (sujeto + verbo).' },
      { tag: 'Expresión idiomática', es: 'Nunca des por sentado un buen sueño', en: 'Never take a good night of sleep for granted', note: '"take [something] for granted" = dar por sentado.' },
      { tag: 'Present Perfect Continuous', es: 'He estado entrenando mi oído durante tres semanas', en: 'I have been training my ear for three weeks', note: 'have/has + been + verbo-ing para acciones que continúan.' },
      { tag: 'Phrasal Verb (pull off)', es: 'Logramos sacar adelante la presentación sin problemas', en: 'We managed to pull off the presentation smoothly', note: '"pull off" = lograr algo difícil con éxito.' },
    ],
  };

  // -------------------- STATE & PERSISTENCE --------------------
  function defaultState() {
    return {
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      voice: 'en-US-AvaNeural',
      theme: 'dark',
      customVocab: [],
      srs: {}, // { [id]: { box: 0..3, reviews: number } }
      completedReadings: [],
      history: [],
      daily: {},
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return {
        ...defaultState(),
        ...parsed,
        customVocab: Array.isArray(parsed.customVocab) ? parsed.customVocab : [],
        srs: parsed.srs || {},
        completedReadings: Array.isArray(parsed.completedReadings) ? parsed.completedReadings : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
        daily: parsed.daily || {},
      };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();

  function getAllVocab() {
    return [...BASE_VOCAB, ...state.customVocab];
  }

  function getTodayRecord() {
    const k = todayKey();
    if (!state.daily[k]) {
      state.daily[k] = {
        vocab: false,
        vocabCount: 0,
        reading: false,
        listening: false,
        builder: false,
        memory: false,
        immersion: false,
        habitSpeak: false,
        habitMedia: false,
        habitThink: false,
      };
    }
    return state.daily[k];
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function updateStreak() {
    const today = todayKey();
    if (state.lastActiveDate === today) return;
    if (state.lastActiveDate) {
      const prev = new Date(state.lastActiveDate + 'T00:00:00');
      const curr = new Date(today + 'T00:00:00');
      const diff = Math.round((curr - prev) / 86400000);
      state.streak = diff === 1 ? state.streak + 1 : 1;
    } else {
      state.streak = 1;
    }
    state.lastActiveDate = today;
  }

  function awardSession({ module, detail, accuracy, xpEarned, dailyKey }) {
    state.xp += xpEarned;
    updateStreak();
    if (dailyKey) getTodayRecord()[dailyKey] = true;
    state.history.unshift({
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      module,
      detail,
      accuracy: Math.round(accuracy),
      xpEarned,
    });
    if (state.history.length > 50) state.history.length = 50;
    saveState();
    renderAllUI();
    showToast(`+${xpEarned} XP — ${module} completado`);
  }

  // -------------------- NAVIGATION & SETTINGS --------------------
  function switchView(viewId) {
    stopSpeaking();
    $$('.view').forEach((v) => v.classList.remove('active'));
    $$('.nav-item').forEach((n) => n.classList.remove('active'));
    const target = $(`#view-${viewId}`);
    const navBtn = $(`.nav-item[data-view="${viewId}"]`);
    if (target) target.classList.add('active');
    if (navBtn) navBtn.classList.add('active');
  }

  $$('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  function applySettings() {
    document.documentElement.setAttribute('data-theme', state.theme);
    $('#toggle-theme').textContent = state.theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
    if ($('#voice-select')) {
      $('#voice-select').value = state.voice || 'en-US-AvaNeural';
    }
  }

  $('#toggle-theme').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    applySettings();
  });

  $('#voice-select').addEventListener('change', (e) => {
    state.voice = e.target.value;
    saveState();
    speakEnglish('Hi! Ready to practice natural English today?', 1.0);
  });

  $('#btn-test-voice').addEventListener('click', () => {
    speakEnglish('Consistency is the secret to speaking natural, fluent English.', 1.0);
  });

  // -------------------- CSV EXPORT --------------------
  $('#btn-export-csv').addEventListener('click', () => {
    const rows = [
      ['Tipo', 'Fecha / Nivel', 'Módulo / Palabra', 'Detalle / Traducción', 'Precisión / Estado SRS'],
      ...state.history.map((h) => ['Sesión', h.date, h.module, h.detail, `${h.accuracy}%`]),
      ...getAllVocab().map((v) => {
        const box = state.srs[v.id]?.box || 0;
        const status = box >= 3 ? 'Dominada' : box > 0 ? `En repaso (Caja ${box})` : 'Nueva';
        return ['Vocabulario', v.lvl, v.en, v.es, status];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluentflow-ingles-${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Estadísticas y vocabulario exportados en CSV');
  });

  // -------------------- DASHBOARD, ROADMAP & CHART --------------------
  const DAILY_STEPS = [
    { key: 'vocab', title: 'Paso 1: Vocabulario SRS (8 tarjetas)', desc: 'Escucha, recuerda en voz alta y evalúa 8 tarjetas.', view: 'vocab', action: 'Practicar SRS' },
    { key: 'reading', title: 'Paso 2: Lectura con Recuerdo Activo', desc: 'Lee y escucha un texto, luego responde sin mirar.', view: 'reading', action: 'Abrir lectura' },
    { key: 'listening', title: 'Paso 3: Escucha, Dictado y Shadowing', desc: 'Completa 5 frases y repítelas en voz alta.', view: 'listening', action: 'Entrenar oído' },
    { key: 'builder', title: 'Paso 4: Constructor de Oraciones', desc: 'Arma 5 estructuras reales en inglés.', view: 'builder', action: 'Armar frases' },
    { key: 'memory', title: 'Paso 5: Sprint de Memoria de Palabras', desc: 'Memoriza y recupera 5 pares Inglés ↔ Español.', view: 'memory', action: 'Iniciar sprint' },
    { key: 'immersion', title: 'Paso 6: Inmersión Real (15–20 min)', desc: 'Video, podcast o lectura 100% en inglés.', view: 'immersion', action: 'Temporizador' },
  ];

  const HABITS_CONFIG = [
    { key: 'habitSpeak', title: 'Hablé 5 minutos en voz alta (Shadowing o monólogo)', desc: 'Describe tu día en inglés o imita una frase de un video nativo.' },
    { key: 'habitMedia', title: 'Consumí 15+ min de contenido real en inglés', desc: 'YouTube, podcast o serie con subtítulos en inglés (o sin subtítulos).' },
    { key: 'habitThink', title: 'Pensé en inglés en una situación cotidiana', desc: 'Nombrar objetos o planificar tu tarde directamente en inglés sin traducir.' },
    { key: 'immersion', title: 'Completé un bloque de inmersión sin distracciones', desc: 'Usa el temporizador de la izquierda para lograrlo.' },
  ];

  function getMasteredWordsCount() {
    return getAllVocab().filter((v) => (state.srs[v.id]?.box || 0) >= 3).length;
  }

  function renderDailySteps() {
    const today = getTodayRecord();
    const container = $('#daily-steps-list');
    container.innerHTML = '';
    let done = 0;

    DAILY_STEPS.forEach((step) => {
      const isDone = Boolean(today[step.key]);
      if (isDone) done++;
      const row = document.createElement('div');
      row.className = `step-row ${isDone ? 'done' : ''}`;
      row.innerHTML = `
        <div class="step-left">
          <div class="step-check" title="Marcar/desmarcar">${isDone ? '✓' : ''}</div>
          <div>
            <div class="step-title">${step.title}</div>
            <div class="step-desc">${step.desc}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm">${isDone ? 'Repetir' : step.action}</button>
      `;
      row.querySelector('.step-check').addEventListener('click', () => {
        today[step.key] = !today[step.key];
        if (today[step.key]) {
          state.xp += 15;
          updateStreak();
        }
        saveState();
        renderAllUI();
      });
      row.querySelector('button').addEventListener('click', () => switchView(step.view));
      container.appendChild(row);
    });

    const pct = Math.round((done / DAILY_STEPS.length) * 100);
    $('#kpi-daily-pct').textContent = `${pct}%`;
    $('#kpi-daily-bar').style.width = `${pct}%`;
    $('#today-date-badge').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  $('#btn-start-daily').addEventListener('click', () => {
    const today = getTodayRecord();
    const next = DAILY_STEPS.find((s) => !today[s.key]) || DAILY_STEPS[0];
    switchView(next.view);
  });

  function renderRoadmap() {
    const mastered = getMasteredWordsCount();
    const readings = state.completedReadings.length;
    const sessions = state.history.length;
    const phases = [
      {
        tag: 'Semana 1 · A1–A2',
        title: 'Base Auditiva y Hábito Diario',
        goals: [
          { text: 'Completar 5 sesiones de práctica', met: sessions >= 5 },
          { text: 'Dominar 5 palabras esenciales en SRS', met: mastered >= 5 },
          { text: 'Completar 1 lectura con recuerdo activo', met: readings >= 1 },
        ],
      },
      {
        tag: 'Semana 2 · A2–B1',
        title: 'Comprensión y Estructura',
        goals: [
          { text: 'Completar 12 sesiones totales', met: sessions >= 12 },
          { text: 'Dominar 12 palabras/expresiones SRS', met: mastered >= 12 },
          { text: 'Completar 2 lecturas activas', met: readings >= 2 },
        ],
      },
      {
        tag: 'Semana 3 · B1',
        title: 'Oído Real y Pensar en Inglés',
        goals: [
          { text: 'Completar 20 sesiones totales', met: sessions >= 20 },
          { text: 'Dominar 18 palabras y phrasal verbs', met: mastered >= 18 },
          { text: 'Completar 3 lecturas activas', met: readings >= 3 },
        ],
      },
      {
        tag: 'Semana 4 · B2+',
        title: 'Fluidez Activa y Autonomía',
        goals: [
          { text: 'Completar 28 sesiones totales', met: sessions >= 28 },
          { text: 'Dominar 24+ palabras (y añadir propias)', met: mastered >= 24 },
          { text: 'Completar las 4 lecturas graduadas', met: readings >= 4 },
        ],
      },
    ];

    const container = $('#roadmap-container');
    container.innerHTML = '';
    phases.forEach((p, idx) => {
      const allMet = p.goals.every((g) => g.met);
      const someMet = p.goals.some((g) => g.met) || idx === 0;
      const card = document.createElement('div');
      card.className = `phase-card ${allMet ? 'completed' : someMet ? 'unlocked' : ''}`;
      card.innerHTML = `
        <span class="phase-tag">${p.tag} ${allMet ? '✅' : ''}</span>
        <h4>${p.title}</h4>
        <ul class="phase-goals">
          ${p.goals.map((g) => `<li class="${g.met ? 'met' : ''}">${g.met ? '✓' : '○'} ${g.text}</li>`).join('')}
        </ul>
      `;
      container.appendChild(card);
    });
  }

  function renderChart() {
    const svg = $('#progress-chart');
    const emptyMsg = $('#chart-empty');
    const recent = state.history.slice(0, 15).reverse();

    if (recent.length === 0) {
      svg.innerHTML = '';
      emptyMsg.classList.remove('hidden');
      return;
    }

    emptyMsg.classList.add('hidden');
    const w = 500, h = 180, padX = 28, padY = 22;
    const plotW = w - padX * 2, plotH = h - padY * 2;

    const points = recent.map((item, i) => {
      const x = recent.length === 1 ? w / 2 : padX + (i / (recent.length - 1)) * plotW;
      const val = Math.max(0, Math.min(100, item.accuracy || 0));
      const y = padY + plotH - (val / 100) * plotH;
      return { x, y, val, label: item.module };
    });

    const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPoints = `${points[0].x.toFixed(1)},${h - padY} ${polyline} ${points[points.length - 1].x.toFixed(1)},${h - padY}`;

    svg.innerHTML = `
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <line x1="${padX}" y1="${padY + plotH * 0.2}" x2="${w - padX}" y2="${padY + plotH * 0.2}" stroke="rgba(16,185,129,0.35)" stroke-dasharray="4 4"/>
      <text x="${padX + 2}" y="${padY + plotH * 0.2 - 4}" fill="#34d399" font-size="10">Meta 80%</text>
      <line x1="${padX}" y1="${h - padY}" x2="${w - padX}" y2="${h - padY}" stroke="rgba(148,163,184,0.22)"/>
      ${points.length > 1 ? `<polygon points="${areaPoints}" fill="url(#chartGrad)"/>` : ''}
      ${points.length > 1 ? `<polyline fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${polyline}"/>` : ''}
      ${points.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#0ea5e9" stroke="#fff" stroke-width="1.5"><title>${p.label}: ${p.val}%</title></circle>`).join('')}
    `;
  }

  function renderHistory() {
    const list = $('#history-list');
    if (state.history.length === 0) {
      list.innerHTML = '<li class="muted">Aún no hay sesiones registradas.</li>';
      return;
    }
    list.innerHTML = state.history.slice(0, 10).map((item) => `
      <li class="history-item">
        <div>
          <strong>${item.module}</strong>
          <div class="muted" style="font-size:0.78rem">${item.detail} · ${item.date}</div>
        </div>
        <span class="badge">${item.accuracy}%</span>
      </li>
    `).join('');
  }

  function renderHabits() {
    const today = getTodayRecord();
    const container = $('#habits-list');
    container.innerHTML = '';
    HABITS_CONFIG.forEach((h) => {
      const checked = Boolean(today[h.key]);
      const label = document.createElement('label');
      label.className = `habit-item ${checked ? 'checked' : ''}`;
      label.innerHTML = `
        <input type="checkbox" ${checked ? 'checked' : ''} />
        <div>
          <div style="font-weight:700;font-size:0.94rem">${h.title}</div>
          <div class="muted" style="font-size:0.82rem">${h.desc}</div>
        </div>
      `;
      label.querySelector('input').addEventListener('change', (e) => {
        today[h.key] = e.target.checked;
        if (e.target.checked) {
          state.xp += 15;
          updateStreak();
        }
        saveState();
        renderAllUI();
      });
      container.appendChild(label);
    });
  }

  function renderAllUI() {
    const level = Math.floor(state.xp / 100) + 1;
    const cefr = level >= 12 ? 'B2+' : level >= 7 ? 'B1' : level >= 3 ? 'A2' : 'A1';
    const xpInLevel = state.xp % 100;
    $('#sidebar-level').textContent = `Nivel ${cefr} · Nv. ${level}`;
    $('#sidebar-xp').textContent = `${xpInLevel} / 100 XP`;
    $('#sidebar-xp-bar').style.width = `${xpInLevel}%`;
    $('#sidebar-streak').textContent = `${state.streak} ${state.streak === 1 ? 'día' : 'días'}`;

    const totalVocab = getAllVocab().length;
    $('#kpi-words-mastered').textContent = String(getMasteredWordsCount());
    $('#kpi-words-total').textContent = `de ${totalVocab} tarjetas en tu mazo`;
    $('#kpi-readings').textContent = String(state.completedReadings.length);
    $('#kpi-sessions').textContent = String(state.history.length);

    $('#vocab-reviewed-today').textContent = `${getTodayRecord().vocabCount || 0} / 8`;

    renderDailySteps();
    renderRoadmap();
    renderChart();
    renderHistory();
    renderHabits();
  }

  $('#btn-reset-data').addEventListener('click', () => {
    if (confirm('¿Seguro que deseas reiniciar todo tu progreso e historial de inglés?')) {
      state = defaultState();
      saveState();
      applySettings();
      pickNextVocabCard();
      renderAllUI();
      showToast('Progreso reiniciado.');
    }
  });

  // ==========================================================================
  // MODULE 1: VOCABULARY SRS
  // ==========================================================================
  let currentCard = null;

  function pickNextVocabCard() {
    const filter = $('#vocab-level-filter').value;
    let pool = getAllVocab();
    if (filter !== 'all') pool = pool.filter((v) => v.lvl === filter);
    if (pool.length === 0) pool = getAllVocab();

    // Prioritize lowest SRS box (due cards first)
    pool.sort((a, b) => (state.srs[a.id]?.box || 0) - (state.srs[b.id]?.box || 0));
    const topCandidates = pool.slice(0, Math.min(5, pool.length));
    const filtered = topCandidates.filter((c) => !currentCard || c.id !== currentCard.id);
    const list = filtered.length ? filtered : topCandidates;
    currentCard = list[Math.floor(Math.random() * list.length)];

    const box = state.srs[currentCard.id]?.box || 0;
    const boxLabels = ['Nueva', 'En aprendizaje', 'Consolidando', 'Dominada ✅'];

    $('#fc-tag').textContent = currentCard.lvl;
    $('#fc-word').textContent = currentCard.en;
    $('#fc-phonetic').textContent = currentCard.ph || '';
    $('#fc-example').textContent = currentCard.ex ? `"${currentCard.ex}"` : '';
    $('#fc-translation').textContent = currentCard.es;
    $('#fc-example-es').textContent = currentCard.exEs || '';
    $('#vocab-card-lvl').textContent = currentCard.lvl;
    $('#vocab-card-box').textContent = boxLabels[Math.min(3, box)];

    $('#fc-back').classList.add('hidden');
    $('#vocab-reveal-wrap').classList.remove('hidden');
    $('#vocab-rate-wrap').classList.add('hidden');
  }

  $('#vocab-level-filter').addEventListener('change', pickNextVocabCard);
  $('#vocab-speak-normal').addEventListener('click', () => {
    if (currentCard) speakEnglish(`${currentCard.en}. ${currentCard.ex || ''}`, 1.0);
  });
  $('#vocab-speak-slow').addEventListener('click', () => {
    if (currentCard) speakEnglish(`${currentCard.en}. ${currentCard.ex || ''}`, 0.75);
  });

  $('#vocab-reveal-btn').addEventListener('click', () => {
    $('#fc-back').classList.remove('hidden');
    $('#vocab-reveal-wrap').classList.add('hidden');
    $('#vocab-rate-wrap').classList.remove('hidden');
    if (currentCard) speakEnglish(currentCard.en, 1.0);
  });

  $$('#vocab-rate-wrap button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!currentCard) return;
      const rate = parseInt(btn.dataset.rate, 10);
      const prev = state.srs[currentCard.id] || { box: 0, reviews: 0 };
      const newBox = rate === 0 ? 0 : rate === 1 ? Math.max(1, prev.box) : rate === 2 ? Math.min(3, prev.box + 1) : 3;
      state.srs[currentCard.id] = { box: newBox, reviews: prev.reviews + 1 };

      const today = getTodayRecord();
      today.vocabCount = (today.vocabCount || 0) + 1;

      if (today.vocabCount === 8 && !today.vocab) {
        awardSession({
          module: 'Vocabulario SRS',
          detail: '8 tarjetas repasadas hoy',
          accuracy: 100,
          xpEarned: 35,
          dailyKey: 'vocab',
        });
      } else {
        state.xp += 4;
        updateStreak();
        saveState();
        renderAllUI();
      }
      pickNextVocabCard();
    });
  });

  $('#vocab-toggle-add').addEventListener('click', () => {
    $('#vocab-add-form').classList.toggle('hidden');
  });

  $('#vocab-add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const en = $('#new-word-en').value.trim();
    const es = $('#new-word-es').value.trim();
    const ex = $('#new-word-ex').value.trim();
    const lvl = $('#new-word-lvl').value;
    if (!en || !es) return;

    state.customVocab.push({ id: `c_${Date.now()}`, en, es, ex, exEs: '', ph: '', lvl });
    saveState();
    $('#vocab-add-form').reset();
    $('#vocab-add-form').classList.add('hidden');
    showToast(`Tarjeta "${en}" añadida a tu mazo`);
    renderAllUI();
  });

  // ==========================================================================
  // MODULE 2: ACTIVE RECALL READING
  // ==========================================================================
  const readingSelect = $('#reading-select');
  READINGS.forEach((r) => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `[${r.level}] ${r.title}`;
    readingSelect.appendChild(opt);
  });

  function getSelectedReading() {
    return READINGS.find((r) => r.id === readingSelect.value) || READINGS[0];
  }

  function loadReading() {
    stopSpeaking();
    const r = getSelectedReading();
    $('#reading-title').textContent = r.title;
    $('#reading-level-badge').textContent = r.level;
    $('#reading-body').textContent = r.text;
    $('#reading-translation').textContent = r.translation;
    $('#reading-translation').classList.add('hidden');
    $('#reading-vocab-chips').innerHTML = r.vocab.map((v) => `<span class="vocab-chip">${v}</span>`).join('');

    $('#reading-text-box').classList.remove('hidden');
    $('#reading-quiz-form').classList.add('hidden');
    $('#reading-result').classList.add('hidden');
  }

  readingSelect.addEventListener('change', loadReading);
  $('#reading-play-audio').addEventListener('click', () => speakEnglish(getSelectedReading().text, 0.92));
  $('#reading-stop-audio').addEventListener('click', stopSpeaking);
  $('#reading-toggle-es').addEventListener('click', () => $('#reading-translation').classList.toggle('hidden'));

  $('#reading-start-quiz').addEventListener('click', () => {
    stopSpeaking();
    const r = getSelectedReading();
    const container = $('#reading-questions-container');
    container.innerHTML = r.questions.map((q, qi) => `
      <div class="quiz-question">
        <strong>${qi + 1}. ${q.q}</strong>
        ${q.opts.map((opt, oi) => `
          <label class="quiz-option">
            <input type="radio" name="rq_${qi}" value="${oi}" required />
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>
    `).join('');
    $('#reading-summary-input').value = '';
    $('#reading-text-box').classList.add('hidden');
    $('#reading-quiz-form').classList.remove('hidden');
    $('#reading-result').classList.add('hidden');
  });

  $('#reading-back-text').addEventListener('click', () => {
    $('#reading-quiz-form').classList.add('hidden');
    $('#reading-text-box').classList.remove('hidden');
  });

  $('#reading-quiz-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = getSelectedReading();
    let correct = 0;
    r.questions.forEach((q, qi) => {
      const chosen = $(`input[name="rq_${qi}"]:checked`);
      if (chosen && parseInt(chosen.value, 10) === q.ans) correct++;
    });

    const summary = $('#reading-summary-input').value.trim();
    const accuracy = Math.round((correct / r.questions.length) * 100);
    if (!state.completedReadings.includes(r.id) && accuracy >= 66) {
      state.completedReadings.push(r.id);
    }

    const res = $('#reading-result');
    res.classList.remove('hidden', 'success', 'warn');
    res.classList.add(accuracy >= 66 ? 'success' : 'warn');
    res.innerHTML = `
      <strong>Lectura Activa: ${correct} / ${r.questions.length} correctas (${accuracy}%)</strong><br/>
      <span class="muted">${summary.length >= 15 ? '¡Excelente resumen en inglés! Eso consolida tu producción activa.' : 'Consejo: la próxima vez escribe al menos 1 frase de resumen en inglés.'}</span>
    `;

    awardSession({
      module: 'Lectura Activa',
      detail: `${r.title} (${correct}/${r.questions.length})`,
      accuracy,
      xpEarned: accuracy >= 66 ? 45 : 20,
      dailyKey: 'reading',
    });
  });

  // ==========================================================================
  // MODULE 3: LISTENING & DICTATION
  // ==========================================================================
  const listenState = { items: [], idx: 0, scores: [] };

  function cleanWords(str) {
    return str.toLowerCase().replace(/[^a-z0-9'\s]/g, '').trim().split(/\s+/).filter(Boolean);
  }

  function showListenItem() {
    const item = listenState.items[listenState.idx];
    $('#listen-progress').textContent = `${listenState.idx + 1} / ${listenState.items.length}`;
    $('#listen-input').value = '';
    $('#listen-input').disabled = false;
    $('#listen-hint-text').textContent = `Traducción: "${item.es}"`;
    $('#listen-hint-text').classList.add('hidden');
    $('#listen-diff').classList.add('hidden');
    $('#listen-next-btn').classList.add('hidden');
    $('#listen-input').focus();
    speakEnglish(item.en, 1.0);
  }

  $('#listen-start-btn').addEventListener('click', () => {
    const lvl = $('#listen-level').value;
    listenState.items = shuffle(LISTENING_BANK[lvl]).slice(0, 5);
    listenState.idx = 0;
    listenState.scores = [];
    $('#listen-avg').textContent = '0%';
    $('#listen-result').classList.add('hidden');
    $('#listen-stage').classList.remove('hidden');
    showListenItem();
  });

  $('#listen-play-normal').addEventListener('click', () => {
    const item = listenState.items[listenState.idx];
    if (item) speakEnglish(item.en, 1.0);
  });

  $('#listen-play-slow').addEventListener('click', () => {
    const item = listenState.items[listenState.idx];
    if (item) speakEnglish(item.en, 0.72);
  });

  $('#listen-hint-btn').addEventListener('click', () => {
    $('#listen-hint-text').classList.toggle('hidden');
  });

  $('#listen-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const item = listenState.items[listenState.idx];
    if (!item || $('#listen-input').disabled) return;

    const targetWords = cleanWords(item.en);
    const userWords = cleanWords($('#listen-input').value);
    let matches = 0;
    const diffHtml = targetWords.map((w, i) => {
      const ok = userWords[i] === w;
      if (ok) matches++;
      return `<span class="${ok ? 'word-ok' : 'word-bad'}">${w}</span>`;
    }).join(' ');

    const acc = Math.round((matches / targetWords.length) * 100);
    listenState.scores.push(acc);
    const avg = Math.round(listenState.scores.reduce((a, b) => a + b, 0) / listenState.scores.length);
    $('#listen-avg').textContent = `${avg}%`;

    const diffBox = $('#listen-diff');
    diffBox.innerHTML = `
      <div><strong>Precisión: ${acc}%</strong></div>
      <div>Frase correcta: ${diffHtml}</div>
      <div class="muted">🗣️ Ahora haz <strong>Shadowing</strong>: pulsa "Escuchar" y repítela en voz alta 2 veces.</div>
    `;
    diffBox.classList.remove('hidden');
    $('#listen-input').disabled = true;
    $('#listen-next-btn').classList.remove('hidden');
    $('#listen-next-btn').textContent = listenState.idx < listenState.items.length - 1 ? 'Siguiente frase →' : 'Finalizar ronda';
  });

  $('#listen-next-btn').addEventListener('click', () => {
    listenState.idx++;
    if (listenState.idx < listenState.items.length) {
      showListenItem();
    } else {
      $('#listen-stage').classList.add('hidden');
      const avg = Math.round(listenState.scores.reduce((a, b) => a + b, 0) / listenState.scores.length);
      const res = $('#listen-result');
      res.classList.remove('hidden', 'success', 'warn');
      res.classList.add(avg >= 75 ? 'success' : 'warn');
      res.innerHTML = `<strong>Ronda de Escucha completada — Precisión promedio: ${avg}%</strong>`;

      awardSession({
        module: 'Escucha y Dictado',
        detail: `${$('#listen-level').value} · 5 frases`,
        accuracy: avg,
        xpEarned: avg >= 75 ? 40 : 25,
        dailyKey: 'listening',
      });
    }
  });

  // ==========================================================================
  // MODULE 4: SENTENCE BUILDER
  // ==========================================================================
  const builder = { items: [], idx: 0, score: 0, chosen: [] };

  function renderBuilderTokens() {
    const item = builder.items[builder.idx];
    const zone = $('#builder-answer-zone');
    zone.innerHTML = '';
    if (builder.chosen.length === 0) {
      zone.innerHTML = '<span class="muted">Haz clic en las palabras de abajo para armar la oración...</span>';
    } else {
      builder.chosen.forEach((tok, pos) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'word-tile';
        btn.textContent = tok.word;
        btn.addEventListener('click', () => {
          builder.chosen.splice(pos, 1);
          renderBuilderTokens();
        });
        zone.appendChild(btn);
      });
    }

    const bank = $('#builder-word-bank');
    bank.innerHTML = '';
    item.shuffled.forEach((tok) => {
      const isUsed = builder.chosen.some((c) => c.id === tok.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `word-tile ${isUsed ? 'used' : ''}`;
      btn.textContent = tok.word;
      btn.addEventListener('click', () => {
        if (isUsed) return;
        builder.chosen.push(tok);
        renderBuilderTokens();
      });
      bank.appendChild(btn);
    });
  }

  function showBuilderItem() {
    const item = builder.items[builder.idx];
    builder.chosen = [];
    $('#builder-progress').textContent = `${builder.idx + 1} / ${builder.items.length}`;
    $('#builder-score').textContent = String(builder.score);
    $('#builder-grammar-tag').textContent = item.tag;
    $('#builder-prompt-es').textContent = `"${item.es}"`;
    $('#builder-feedback').classList.add('hidden');
    $('#builder-check-btn').classList.remove('hidden');
    $('#builder-next-btn').classList.add('hidden');
    renderBuilderTokens();
  }

  $('#builder-start-btn').addEventListener('click', () => {
    const lvl = $('#builder-level').value;
    builder.items = shuffle(BUILDER_BANK[lvl]).slice(0, 5).map((it) => ({
      ...it,
      shuffled: shuffle(it.en.split(' ').map((word, id) => ({ word, id }))),
    }));
    builder.idx = 0;
    builder.score = 0;
    $('#builder-result').classList.add('hidden');
    $('#builder-stage').classList.remove('hidden');
    showBuilderItem();
  });

  $('#builder-clear-btn').addEventListener('click', () => {
    builder.chosen = [];
    renderBuilderTokens();
  });

  $('#builder-check-btn').addEventListener('click', () => {
    const item = builder.items[builder.idx];
    const built = builder.chosen.map((c) => c.word).join(' ');
    const ok = built.toLowerCase() === item.en.toLowerCase();
    if (ok) builder.score++;
    $('#builder-score').textContent = String(builder.score);

    const fb = $('#builder-feedback');
    fb.classList.remove('hidden', 'success', 'warn');
    fb.classList.add(ok ? 'success' : 'warn');
    fb.innerHTML = `
      <strong>${ok ? '¡Correcto!' : 'Casi — Respuesta correcta:'}</strong> "${item.en}"<br/>
      <span class="muted">💡 ${item.note}</span>
    `;
    speakEnglish(item.en, 0.95);
    $('#builder-check-btn').classList.add('hidden');
    $('#builder-next-btn').classList.remove('hidden');
    $('#builder-next-btn').textContent = builder.idx < builder.items.length - 1 ? 'Siguiente →' : 'Finalizar';
  });

  $('#builder-next-btn').addEventListener('click', () => {
    builder.idx++;
    if (builder.idx < builder.items.length) {
      showBuilderItem();
    } else {
      $('#builder-stage').classList.add('hidden');
      const acc = Math.round((builder.score / builder.items.length) * 100);
      const res = $('#builder-result');
      res.classList.remove('hidden', 'success', 'warn');
      res.classList.add(acc >= 80 ? 'success' : 'warn');
      res.innerHTML = `<strong>Constructor completado: ${builder.score} / ${builder.items.length} (${acc}%)</strong>`;

      awardSession({
        module: 'Armar Oraciones',
        detail: `${$('#builder-level').value} · ${builder.score}/${builder.items.length}`,
        accuracy: acc,
        xpEarned: acc >= 80 ? 40 : 25,
        dailyKey: 'builder',
      });
    }
  });

  // ==========================================================================
  // MODULE 5: WORD MEMORY SPRINT
  // ==========================================================================
  const mem = { pairs: [], qIdx: 0, score: 0, interval: null };

  $('#memory-start-btn').addEventListener('click', () => {
    clearInterval(mem.interval);
    const lvl = $('#memory-level').value;
    let pool = getAllVocab().filter((v) => v.lvl === lvl);
    if (pool.length < 5) pool = getAllVocab();
    mem.pairs = shuffle(pool).slice(0, 5);
    mem.qIdx = 0;
    mem.score = 0;

    $('#memory-result').classList.add('hidden');
    $('#memory-recall-phase').classList.add('hidden');
    $('#memory-study-phase').classList.remove('hidden');

    $('#memory-pairs-list').innerHTML = mem.pairs.map((p) => `
      <div class="memory-pair-row">
        <strong>${p.en}</strong>
        <span>${p.es}</span>
      </div>
    `).join('');

    let secs = 10;
    $('#memory-countdown').textContent = `${secs}s`;
    const bar = $('#memory-timer-bar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => {
      bar.style.transition = 'width 10000ms linear';
      bar.style.width = '0%';
    });

    mem.interval = setInterval(() => {
      secs--;
      $('#memory-countdown').textContent = `${Math.max(0, secs)}s`;
      if (secs <= 0) {
        clearInterval(mem.interval);
        $('#memory-study-phase').classList.add('hidden');
        $('#memory-recall-phase').classList.remove('hidden');
        mem.pairs = shuffle(mem.pairs);
        showMemoryQuestion();
      }
    }, 1000);
  });

  function showMemoryQuestion() {
    const current = mem.pairs[mem.qIdx];
    $('#memory-q-num').textContent = `${mem.qIdx + 1} / ${mem.pairs.length}`;
    $('#memory-q-es').textContent = current.es;

    const distractors = shuffle(getAllVocab().filter((v) => v.id !== current.id)).slice(0, 3);
    const opts = shuffle([current, ...distractors]);

    const box = $('#memory-options');
    box.innerHTML = '';
    opts.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'memory-opt-btn';
      btn.textContent = opt.en;
      btn.addEventListener('click', () => {
        $$('#memory-options button').forEach((b) => (b.disabled = true));
        if (opt.id === current.id) {
          btn.classList.add('ok');
          mem.score++;
          speakEnglish(current.en, 1.0);
        } else {
          btn.classList.add('bad');
          const rightBtn = Array.from(box.children).find((b) => b.textContent === current.en);
          if (rightBtn) rightBtn.classList.add('ok');
        }
        setTimeout(() => {
          mem.qIdx++;
          if (mem.qIdx < mem.pairs.length) {
            showMemoryQuestion();
          } else {
            $('#memory-recall-phase').classList.add('hidden');
            const acc = Math.round((mem.score / mem.pairs.length) * 100);
            const res = $('#memory-result');
            res.classList.remove('hidden', 'success', 'warn');
            res.classList.add(acc >= 80 ? 'success' : 'warn');
            res.innerHTML = `<strong>Sprint de Memoria completado: ${mem.score} / ${mem.pairs.length} (${acc}%)</strong>`;

            awardSession({
              module: 'Memoria de Palabras',
              detail: `${$('#memory-level').value} · ${mem.score}/${mem.pairs.length}`,
              accuracy: acc,
              xpEarned: acc >= 80 ? 35 : 20,
              dailyKey: 'memory',
            });
          }
        }, 750);
      });
      box.appendChild(btn);
    });
  }

  // ==========================================================================
  // IMMERSION TIMER
  // ==========================================================================
  const pomo = { totalSeconds: 20 * 60, remaining: 20 * 60, interval: null };

  function renderPomo() {
    const m = String(Math.floor(pomo.remaining / 60)).padStart(2, '0');
    const s = String(pomo.remaining % 60).padStart(2, '0');
    $('#pomo-display').textContent = `${m}:${s}`;
  }

  $$('.timer-presets button').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearInterval(pomo.interval);
      pomo.interval = null;
      $$('.timer-presets button').forEach((b) => b.classList.remove('active-preset'));
      btn.classList.add('active-preset');
      const mins = parseInt(btn.dataset.minutes, 10);
      pomo.totalSeconds = mins * 60;
      pomo.remaining = pomo.totalSeconds;
      renderPomo();
      $('#pomo-status').textContent = `Bloque configurado a ${mins} minutos de inmersión.`;
    });
  });

  $('#pomo-start').addEventListener('click', () => {
    if (pomo.interval) return;
    $('#pomo-status').textContent = 'En inmersión total en inglés... ¡sin subtítulos en español!';
    pomo.interval = setInterval(() => {
      pomo.remaining--;
      renderPomo();
      if (pomo.remaining <= 0) {
        clearInterval(pomo.interval);
        pomo.interval = null;
        $('#pomo-status').textContent = '¡Bloque de inmersión completado!';
        awardSession({
          module: 'Inmersión en Inglés',
          detail: `${Math.round(pomo.totalSeconds / 60)} min en inglés real`,
          accuracy: 100,
          xpEarned: 40,
          dailyKey: 'immersion',
        });
      }
    }, 1000);
  });

  $('#pomo-pause').addEventListener('click', () => {
    clearInterval(pomo.interval);
    pomo.interval = null;
    $('#pomo-status').textContent = 'Temporizador en pausa.';
  });

  $('#pomo-reset').addEventListener('click', () => {
    clearInterval(pomo.interval);
    pomo.interval = null;
    pomo.remaining = pomo.totalSeconds;
    renderPomo();
    $('#pomo-status').textContent = 'Temporizador reiniciado.';
  });

  // -------------------- INIT --------------------
  applySettings();
  detectNeuralServer();
  pickNextVocabCard();
  loadReading();
  renderPomo();
  renderAllUI();
})();
