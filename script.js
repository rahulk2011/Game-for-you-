/**
 * ============================================================================
 * SIBLING SHOWDOWN — REAL-TIME MULTIPLAYER TRUTH OR DARE
 * Architecture: Room-Based Multiplayer with Firebase Realtime Database (ES6+)
 * Files: index.html, style.css, script.js (Zero Front-End Frameworks)
 * ============================================================================
 */

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  onDisconnect,
} from 'firebase/database';

/* ============================================================================
 * 1. FIREBASE CONFIGURATION BLOCK
 * Paste your Firebase project keys below. Ensure Realtime Database is enabled
 * in your Firebase Console and `databaseURL` points to your RTDB instance.
 * ============================================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyByXPB4A_zM0EiSSg33UC1kCo4FY-AEAQE",
  authDomain: "winter-envoy-1xctm.firebaseapp.com",
  databaseURL: "https://winter-envoy-1xctm-default-rtdb.firebaseio.com",
  projectId: "winter-envoy-1xctm",
  storageBucket: "winter-envoy-1xctm.firebasestorage.app",
  messagingSenderId: "1021618443018",
  appId: "1:1021618443018:web:17b0d5864ba8c9b1eba0f3"
};

/* ============================================================================
 * 2. SIBLING-FRIENDLY CONTENT ARRAYS (30 TRUTHS & 30 DARES)
 * Lighthearted, clean, and relatable prompts designed for a brother-sister dynamic.
 * ============================================================================ */
const TRUTH_PROMPTS = [
  "What is the most annoying habit I have?",
  "Did you ever break something in the house and blame it on me?",
  "What's the funniest secret you've kept from mom and dad?",
  "Have you ever secretly borrowed my clothes or charger without asking?",
  "Who do you think is secretly mom and dad's favorite child, and why?",
  "What is the worst gift you have ever received from a family member?",
  "Have you ever eaten leftovers in the fridge that clearly had my name on them?",
  "What was the most ridiculous excuse you ever used to get out of doing chores?",
  "Did you ever peek at your birthday or holiday presents before you were supposed to?",
  "What is your most embarrassing childhood memory that happened on a family trip?",
  "If you could trade one of my personality traits for another, what would it be?",
  "Have you ever pretended to be asleep so you wouldn't have to help carry groceries inside?",
  "What is the weirdest food combination you secretly enjoy when nobody is watching?",
  "Did you ever forged or thought about faking a parent's signature on a school note?",
  "What was the silliest argument we ever had that you actually knew you were wrong about?",
  "Have you ever eavesdropped on a conversation you definitely weren't supposed to hear?",
  "If we were stranded on a desert island together, which one of us would survive longer?",
  "What is a movie or song you pretend to hate in front of me, but secretly love?",
  "Have you ever blamed the family pet or me for a mess you made in the kitchen?",
  "What is the funniest thing you used to believe was true when you were a little kid?",
  "Have you ever accidentally sent a text about a family member to that exact family member?",
  "If you had to confess one thing to mom and dad right now with zero punishment, what would it be?",
  "When was a time you were genuinely proud of me, even if you didn't say it out loud?",
  "Have you ever hidden the TV remote on purpose just so I couldn't change the channel?",
  "What is the most dramatic overreaction you've ever had over something super small?",
  "Did you ever tell our parents that you brushed your teeth when you just ran the sink water?",
  "What is the funniest nickname you've ever heard someone in our family get called?",
  "Have you ever snooped through my room looking for snacks or spare change?",
  "If we swapped lives for one full week, what part of my schedule would you dread the most?",
  "What is one family rule growing up that you thought made absolutely zero sense?"
];

const DARE_PROMPTS = [
  "Let me draw something on your face with a washable pen.",
  "Do 10 pushups while shouting my name on every rep.",
  "Speak in a funny accent for the next 3 rounds.",
  "Stand up and perform a 30-second dramatic opera song about how awesome I am.",
  "Walk into the kitchen and ask a glass of water how its day is going with a straight face.",
  "Let me style your hair however I want and keep it like that for the next 3 turns.",
  "Talk without closing your mouth or using your lips for the next 2 rounds.",
  "Do your best impression of how I look when I wake up early in the morning.",
  "Balance a spoon on your nose for at least 15 seconds without dropping it.",
  "Send a voice note or text to the family group chat saying 'I officially declare my sibling is the smartest person alive.'",
  "Do 15 jumping jacks while reciting the alphabet backward as fast as you can.",
  "Wear your socks on your hands for the next 3 rounds of the game.",
  "Act like a news anchor reporting breaking news about what you ate for breakfast today.",
  "Try to lick your own elbow for 20 seconds while making serious concentration noises.",
  "Hold a plank position for 30 seconds while naming 10 things you like about our family.",
  "Speak only in rhymes until your next turn comes around.",
  "Do a slow-motion action movie entrance from the hallway into the room.",
  "Let me pick a random object in the room, and you have to pitch it like a TV infomercial for 45 seconds.",
  "Keep a completely straight face for 30 seconds while I try my hardest to make you laugh.",
  "Walk backward everywhere you go in the house for the next 5 minutes.",
  "Pretend the floor is lava for the next 60 seconds and narrate your survival.",
  "Do your best impression of mom or dad when they are looking for their lost keys.",
  "Hold an imaginary microphone and beatbox for 20 seconds straight.",
  "Take a funny selfie making the most ridiculous face possible and set it as your lock screen for 10 minutes.",
  "Say 'All hail the supreme sibling' before and after everything you say for the next 2 turns.",
  "Attempt to do a moonwalk across the room while humming a dramatic theme song.",
  "Eat a spoonful of a condiment from the kitchen chosen by me (nothing spicy or unsafe!).",
  "Pretend to be a robot whose battery is slowly running out for the next 30 seconds.",
  "Try to juggle three soft items (like rolled-up socks or pillows) for 20 seconds.",
  "Bow politely and call me 'Your Royal Highness' until your next turn ends."
];

/* ============================================================================
 * 3. APPLICATION STATE & FIREBASE INITIALIZATION
 * ============================================================================ */
let firebaseApp = null;
let realtimeDb = null;
let activeRoomUnsubscribe = null;
let broadcastChannel = null;

const appState = {
  roomCode: null,
  localRole: null, // "player1" (Host) or "player2" (Guest)
  singleDeviceTestMode: false,
  soundEnabled: true,
  activeDeckTab: 'truths',
  usedTruthIndices: new Set(),
  usedDareIndices: new Set(),
  roomData: null,
};

// Setup cross-tab BroadcastChannel for instant local multi-tab testing Alongside Firebase RTDB
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('sibling_truth_or_dare_sync');
    broadcastChannel.onmessage = (event) => {
      const payload = event.data;
      if (
        payload &&
        payload.type === 'ROOM_UPDATE' &&
        payload.roomCode === appState.roomCode
      ) {
        handleIncomingRoomSnapshot(payload.data, 'Local Realtime Sync');
      }
    };
  }
} catch {
  // BroadcastChannel not supported in restricted contexts; localStorage & Firebase handle sync
}

window.addEventListener('storage', (event) => {
  if (
    appState.roomCode &&
    event.key === `sibling_tod_room_${appState.roomCode}` &&
    event.newValue
  ) {
    try {
      const parsed = JSON.parse(event.newValue);
      handleIncomingRoomSnapshot(parsed, 'Local Realtime Sync');
    } catch {
      // Ignore malformed storage data
    }
  }
});

/**
 * Initialize Firebase Realtime Database safely with fallback support
 */
function initFirebaseDatabase() {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    if (firebaseConfig.databaseURL) {
      realtimeDb = getDatabase(firebaseApp);
      updateSyncEngineBadge('Firebase RTDB Ready');
    } else {
      updateSyncEngineBadge('Local Sync Active');
    }
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
    updateSyncEngineBadge('Local Sync Fallback');
  }
}

/* ============================================================================
 * 4. WEB AUDIO SYNTHESIZER (Tactile UI Sound Feedback)
 * ============================================================================ */
let audioCtx = null;

function playUiSound(type = 'tap') {
  if (!appState.soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'truth') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'dare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.16);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'join') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch {
    // Ignore audio context restrictions
  }
}

/* ============================================================================
 * 5. ROOM CODE GENERATOR & FIREBASE DATA ACCESS LAYER
 * ============================================================================ */

/**
 * Generates a random 5-character uppercase alphanumeric room code (excluding ambiguous I, O, 0, 1)
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return code;
}

/**
 * Builds the shareable invite URL containing `?room=ABCDE`
 */
function buildInviteUrl(roomCode) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomCode);
  url.hash = '';
  return url.toString();
}

/**
 * Helper to wrap a Firebase Realtime Database promise with a fast timeout
 * so the UI stays under 100ms responsiveness even if a user hasn't created
 * their RTDB instance in the Firebase console yet.
 */
function withFastTimeout(promise, ms = 1200) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RTDB_TIMEOUT')), ms)
    ),
  ]);
}

/**
 * Mirrors room state to localStorage + BroadcastChannel for instant <15ms cross-tab sync
 */
function persistLocalMirror(roomCode, roomState) {
  try {
    localStorage.setItem(
      `sibling_tod_room_${roomCode}`,
      JSON.stringify(roomState)
    );
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'ROOM_UPDATE',
        roomCode,
        data: roomState,
      });
    }
  } catch {
    // Ignore private browsing storage quota errors
  }
}

function readLocalMirror(roomCode) {
  try {
    const raw = localStorage.getItem(`sibling_tod_room_${roomCode}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Writes initial room state to `rooms/<room_code>` in Firebase Realtime Database
 */
async function createRoomInDatabase(roomCode, initialRoomState) {
  persistLocalMirror(roomCode, initialRoomState);

  if (!realtimeDb) return;
  try {
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
    await withFastTimeout(set(roomRef, initialRoomState), 1200);
    // Register disconnect cleanup for Player 1
    try {
      const p1DisconnectRef = ref(
        realtimeDb,
        `rooms/${roomCode}/player1_connected`
      );
      onDisconnect(p1DisconnectRef).set(false);
    } catch {
      // Ignore onDisconnect errors
    }
    updateSyncEngineBadge('Firebase RTDB Connected');
  } catch {
    updateSyncEngineBadge('Realtime Local Mirror');
  }
}

/**
 * Reads `rooms/<room_code>` from Firebase Realtime Database (or local mirror)
 */
async function fetchRoomFromDatabase(roomCode) {
  const localData = readLocalMirror(roomCode);

  if (realtimeDb) {
    try {
      const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
      const snapshot = await withFastTimeout(get(roomRef), 1200);
      if (snapshot && snapshot.exists()) {
        const val = snapshot.val();
        persistLocalMirror(roomCode, val);
        updateSyncEngineBadge('Firebase RTDB Connected');
        return val;
      }
    } catch {
      updateSyncEngineBadge('Realtime Local Mirror');
    }
  }

  return localData;
}

/**
 * Updates specific keys under `rooms/<room_code>` in Firebase Realtime Database
 */
async function updateRoomInDatabase(roomCode, partialUpdates) {
  const current = appState.roomData || readLocalMirror(roomCode) || {};
  const merged = {
    ...current,
    ...partialUpdates,
    current_question: partialUpdates.current_question
      ? { ...partialUpdates.current_question }
      : current.current_question || { type: '', text: '' },
    updated_at: Date.now(),
  };

  // Immediately apply and broadcast locally (< 10ms latency)
  persistLocalMirror(roomCode, merged);
  handleIncomingRoomSnapshot(merged);

  if (!realtimeDb) return;
  try {
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
    await withFastTimeout(update(roomRef, partialUpdates), 1200);
    updateSyncEngineBadge('Firebase RTDB Synced');
  } catch {
    updateSyncEngineBadge('Realtime Local Mirror');
  }
}

/**
 * Subscribes to real-time updates on `rooms/<room_code>` via Firebase `onValue`
 */
function subscribeToRoom(roomCode) {
  if (activeRoomUnsubscribe) {
    activeRoomUnsubscribe();
    activeRoomUnsubscribe = null;
  }

  if (realtimeDb) {
    try {
      const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
      activeRoomUnsubscribe = onValue(
        roomRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            persistLocalMirror(roomCode, data);
            handleIncomingRoomSnapshot(data, 'Firebase RTDB Live');
          }
        },
        () => {
          updateSyncEngineBadge('Realtime Local Mirror');
        }
      );
    } catch {
      updateSyncEngineBadge('Realtime Local Mirror');
    }
  }
}

/* ============================================================================
 * 6. CORE MULTIPLAYER FLOWS (CREATE, JOIN, REVEAL PROMPT, NEXT TURN)
 * ============================================================================ */

/**
 * Player 1 clicks "Create Game":
 * 1. Generates 5-char room code
 * 2. Pushes initial state to `rooms/<room_code>`
 * 3. Updates URL with `?room=<room_code>`
 * 4. Enters Lobby Phase
 */
async function handleCreateGame() {
  hideErrorBanner();
  playUiSound('tap');

  const roomCode = generateRoomCode();
  const initialRoomState = {
    player1_connected: true,
    player2_connected: false,
    current_turn: 'player1',
    game_status: 'waiting',
    current_question: {
      type: '',
      text: '',
    },
    round_number: 1,
    updated_at: Date.now(),
  };

  appState.roomCode = roomCode;
  appState.localRole = 'player1';
  appState.singleDeviceTestMode = false;
  appState.roomData = initialRoomState;

  // Update browser URL cleanly without reloading
  const newUrl = buildInviteUrl(roomCode);
  window.history.replaceState({ roomCode }, '', newUrl);

  // Render Lobby immediately and sync with Firebase
  renderRoomUI(initialRoomState);
  subscribeToRoom(roomCode);
  await createRoomInDatabase(roomCode, initialRoomState);
}

/**
 * Player 2 opens `?room=ABCDE` or submits the 5-character room code form
 */
async function handleJoinRoom(rawCode) {
  hideErrorBanner();
  const normalizedCode = String(rawCode || '')
    .trim()
    .toUpperCase();

  if (!/^[A-Z0-9]{5}$/.test(normalizedCode)) {
    showErrorBanner(
      'Please enter a valid 5-character alphanumeric room code (e.g., K9X4M).'
    );
    return;
  }

  playUiSound('tap');
  const existingRoom = await fetchRoomFromDatabase(normalizedCode);

  if (!existingRoom) {
    showErrorBanner(
      `Room "${normalizedCode}" was not found. Check the code with your sibling or click "Create Game" to start a new room.`
    );
    return;
  }

  appState.roomCode = normalizedCode;
  // Determine role: if joining a waiting room, connect as Player 2
  appState.localRole = 'player2';
  appState.singleDeviceTestMode = false;

  const updatedUrl = buildInviteUrl(normalizedCode);
  window.history.replaceState({ roomCode: normalizedCode }, '', updatedUrl);

  subscribeToRoom(normalizedCode);

  // Register disconnect cleanup if RTDB is active
  if (realtimeDb) {
    try {
      const p2DisconnectRef = ref(
        realtimeDb,
        `rooms/${normalizedCode}/player2_connected`
      );
      onDisconnect(p2DisconnectRef).set(false);
    } catch {
      // Ignore onDisconnect errors
    }
  }

  playUiSound('join');

  await updateRoomInDatabase(normalizedCode, {
    player2_connected: true,
    game_status: 'playing',
  });
}

/**
 * Allows instant sibling connection when testing on a single device
 */
async function handleSimulateSiblingConnect() {
  if (!appState.roomCode) return;
  playUiSound('join');
  appState.singleDeviceTestMode = true;

  await updateRoomInDatabase(appState.roomCode, {
    player2_connected: true,
    game_status: 'playing',
  });
  showToast('Player 2 connected! Game started.');
}

/**
 * Picks a random non-repeating Truth or Dare prompt and updates Firebase
 */
async function handleSelectPrompt(category) {
  if (!appState.roomCode || !appState.roomData) return;

  const isMyTurn = appState.roomData.current_turn === appState.localRole;
  if (!isMyTurn) return;

  const hasActiveQuestion =
    appState.roomData.current_question &&
    Boolean(appState.roomData.current_question.text);
  if (hasActiveQuestion) return;

  const isTruth = category === 'truth';
  const pool = isTruth ? TRUTH_PROMPTS : DARE_PROMPTS;
  const usedSet = isTruth ? appState.usedTruthIndices : appState.usedDareIndices;

  if (usedSet.size >= pool.length) {
    usedSet.clear();
  }

  const availableIndices = [];
  for (let i = 0; i < pool.length; i += 1) {
    if (!usedSet.has(i)) availableIndices.push(i);
  }

  const chosenIndex =
    availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedSet.add(chosenIndex);

  const selectedPromptText = pool[chosenIndex];
  playUiSound(isTruth ? 'truth' : 'dare');

  await updateRoomInDatabase(appState.roomCode, {
    current_question: {
      type: isTruth ? 'truth' : 'dare',
      text: selectedPromptText,
    },
  });
}

/**
 * Clicking "Next Turn" flips `current_turn` in Firebase ("player1" <-> "player2")
 * and clears `current_question` from both screens.
 */
async function handleNextTurn() {
  if (!appState.roomCode || !appState.roomData) return;
  playUiSound('tap');

  const currentTurn = appState.roomData.current_turn || 'player1';
  const nextTurn = currentTurn === 'player1' ? 'player2' : 'player1';
  const currentRound = Number(appState.roomData.round_number || 1);

  // If testing both siblings on one screen, automatically shift perspective to the active sibling
  if (appState.singleDeviceTestMode) {
    appState.localRole = nextTurn;
  }

  await updateRoomInDatabase(appState.roomCode, {
    current_turn: nextTurn,
    current_question: {
      type: '',
      text: '',
    },
    round_number: currentRound + 1,
  });
}

/**
 * Leaves the current room and resets to the Setup view
 */
function handleLeaveRoom() {
  playUiSound('tap');
  if (activeRoomUnsubscribe) {
    activeRoomUnsubscribe();
    activeRoomUnsubscribe = null;
  }

  appState.roomCode = null;
  appState.localRole = null;
  appState.roomData = null;
  appState.singleDeviceTestMode = false;

  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('room');
  window.history.replaceState({}, '', cleanUrl.toString());

  renderSetupView();
}

/* ============================================================================
 * 7. REAL-TIME SNAPSHOT HANDLER & DOM RENDERING
 * ============================================================================ */

function handleIncomingRoomSnapshot(roomSnapshot, badgeLabel) {
  if (!roomSnapshot) return;

  const previousStatus = appState.roomData
    ? appState.roomData.game_status
    : null;
  appState.roomData = roomSnapshot;

  if (badgeLabel) {
    updateSyncEngineBadge(badgeLabel);
  }

  if (previousStatus === 'waiting' && roomSnapshot.game_status === 'playing') {
    playUiSound('join');
  }

  renderRoomUI(roomSnapshot);
}

function renderSetupView() {
  document.getElementById('setup-view').classList.remove('hidden');
  document.getElementById('lobby-view').classList.add('hidden');
  document.getElementById('game-view').classList.add('hidden');

  document.getElementById('meta-role-label').textContent = 'Multiplayer Ready';
  document.getElementById('meta-room-label').textContent = 'No Active Room';
  document.getElementById('meta-round-label').textContent = 'Round 0';

  const p1Status = document.getElementById('roster-player1-status');
  const p2Status = document.getElementById('roster-player2-status');
  p1Status.textContent = 'Offline';
  p1Status.className = 'player-state-text tabular-nums';
  p2Status.textContent = 'Offline';
  p2Status.className = 'player-state-text tabular-nums';

  document
    .getElementById('roster-player1-row')
    .classList.remove('active-turn-row');
  document
    .getElementById('roster-player2-row')
    .classList.remove('active-turn-row');
}

function renderRoomUI(room) {
  const setupView = document.getElementById('setup-view');
  const lobbyView = document.getElementById('lobby-view');
  const gameView = document.getElementById('game-view');

  const roleText =
    appState.localRole === 'player1'
      ? 'You are Player 1 (Host)'
      : 'You are Player 2 (Sibling)';
  document.getElementById('meta-role-label').textContent = roleText;
  document.getElementById('meta-room-label').textContent =
    `Room ${appState.roomCode}`;
  document.getElementById('meta-round-label').textContent =
    `Round ${room.round_number || 1}`;

  // Update Connected Players Roster
  const p1Status = document.getElementById('roster-player1-status');
  const p2Status = document.getElementById('roster-player2-status');
  const p1Row = document.getElementById('roster-player1-row');
  const p2Row = document.getElementById('roster-player2-row');

  p1Status.textContent = room.player1_connected ? 'Connected' : 'Disconnected';
  p1Status.className = `player-state-text tabular-nums ${
    room.player1_connected ? 'online' : 'waiting'
  }`;

  p2Status.textContent = room.player2_connected
    ? 'Connected'
    : 'Waiting to join...';
  p2Status.className = `player-state-text tabular-nums ${
    room.player2_connected ? 'online' : 'waiting'
  }`;

  p1Row.classList.toggle('active-turn-row', room.current_turn === 'player1');
  p2Row.classList.toggle('active-turn-row', room.current_turn === 'player2');

  // Check if in Lobby Phase or Playing Phase
  const isPlaying =
    room.game_status === 'playing' &&
    room.player1_connected &&
    room.player2_connected;

  if (!isPlaying) {
    setupView.classList.add('hidden');
    lobbyView.classList.remove('hidden');
    gameView.classList.add('hidden');

    document.getElementById('lobby-room-code').textContent = appState.roomCode;
    document.getElementById('lobby-invite-url').textContent = buildInviteUrl(
      appState.roomCode
    );
    document.getElementById('lobby-waiting-text').textContent =
      'Waiting for your sibling to join...';
    return;
  }

  // Active Gameplay Phase
  setupView.classList.add('hidden');
  lobbyView.classList.add('hidden');
  gameView.classList.remove('hidden');

  const isMyTurn = room.current_turn === appState.localRole;
  const turnBanner = document.getElementById('turn-banner');
  const turnHeading = document.getElementById('turn-status-heading');
  const turnSubtext = document.getElementById('turn-status-subtext');
  const switchPerspectiveBtn = document.getElementById(
    'btn-switch-perspective'
  );

  // Show perspective switcher if testing in single-device mode
  if (appState.singleDeviceTestMode) {
    switchPerspectiveBtn.classList.remove('hidden');
    switchPerspectiveBtn.textContent =
      appState.localRole === 'player1'
        ? 'View as Player 2'
        : 'View as Player 1';
  } else {
    switchPerspectiveBtn.classList.add('hidden');
  }

  const questionObj = room.current_question || { type: '', text: '' };
  const hasQuestionRevealed = Boolean(
    questionObj.text && questionObj.text.trim().length > 0
  );

  if (isMyTurn) {
    turnBanner.classList.add('is-my-turn');
    turnBanner.classList.remove('is-waiting-turn');
    turnHeading.textContent = 'Your Turn!';
    turnSubtext.textContent = hasQuestionRevealed
      ? 'Complete the challenge below, then tap Next Turn to pass to your sibling.'
      : 'Choose Truth or Dare below to reveal a prompt on both screens.';
  } else {
    turnBanner.classList.remove('is-my-turn');
    turnBanner.classList.add('is-waiting-turn');
    turnHeading.textContent = 'Waiting for other player...';
    turnSubtext.textContent = hasQuestionRevealed
      ? 'Your sibling is completing their challenge right now!'
      : 'Your sibling is deciding between Truth and Dare...';
  }

  // Enable/Disable Truth & Dare buttons strictly based on turn and whether a prompt is already active
  const btnTruth = document.getElementById('btn-truth');
  const btnDare = document.getElementById('btn-dare');
  btnTruth.disabled = !isMyTurn || hasQuestionRevealed;
  btnDare.disabled = !isMyTurn || hasQuestionRevealed;

  // Render Question Stage & Next Turn Button
  const questionStage = document.getElementById('question-stage');
  const emptyStateEl = document.getElementById('question-empty-state');
  const activeStateEl = document.getElementById('question-active-state');
  const questionTypeLabel = document.getElementById('question-type-label');
  const questionTextDisplay = document.getElementById('question-text-display');
  const btnNextTurn = document.getElementById('btn-next-turn');

  questionStage.classList.remove('is-truth', 'is-dare');

  if (hasQuestionRevealed) {
    emptyStateEl.classList.add('hidden');
    activeStateEl.classList.remove('hidden');
    btnNextTurn.classList.remove('hidden');

    const isTruthPrompt = questionObj.type === 'truth';
    questionStage.classList.add(isTruthPrompt ? 'is-truth' : 'is-dare');

    const activePlayerName =
      room.current_turn === 'player1'
        ? 'Player 1 (Host)'
        : 'Player 2 (Sibling)';
    questionTypeLabel.textContent = `${
      isTruthPrompt ? 'TRUTH' : 'DARE'
    } · ${activePlayerName.toUpperCase()}`;
    questionTextDisplay.textContent = questionObj.text;
  } else {
    emptyStateEl.classList.remove('hidden');
    activeStateEl.classList.add('hidden');
    btnNextTurn.classList.add('hidden');
    emptyStateEl.textContent = isMyTurn
      ? 'Tap Truth or Dare above to draw your challenge!'
      : 'Waiting for your sibling to pick Truth or Dare...';
  }
}

/* ============================================================================
 * 8. CLIPBOARD, TOAST, ERROR BANNER & DECK BROWSER HELPERS
 * ============================================================================ */

let toastTimeoutId = null;

function showToast(message = 'Copied!') {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('visible');

  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2400);
}

async function copyInviteLinkToClipboard() {
  if (!appState.roomCode) return;
  playUiSound('tap');
  const inviteUrl = buildInviteUrl(appState.roomCode);

  try {
    await navigator.clipboard.writeText(inviteUrl);
    showToast('Copied!');
  } catch {
    // Fallback copy method for older mobile browsers
    const tempInput = document.createElement('textarea');
    tempInput.value = inviteUrl;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('Copied!');
  }
}

function showErrorBanner(message) {
  const banner = document.getElementById('error-banner');
  const textEl = document.getElementById('error-banner-text');
  textEl.textContent = message;
  banner.classList.remove('hidden');
}

function hideErrorBanner() {
  const banner = document.getElementById('error-banner');
  banner.classList.add('hidden');
}

function updateSyncEngineBadge(text) {
  const el = document.getElementById('sync-engine-label');
  if (el) el.textContent = text;
}

/**
 * Renders the 30 Truths or 30 Dares in the Sibling Prompt Deck Browser
 */
function renderPromptDeck() {
  const listContainer = document.getElementById('prompt-deck-list');
  const countTruthsEl = document.getElementById('count-truths');
  const countDaresEl = document.getElementById('count-dares');
  const totalCountEl = document.getElementById('deck-total-count');

  countTruthsEl.textContent = String(TRUTH_PROMPTS.length);
  countDaresEl.textContent = String(DARE_PROMPTS.length);
  totalCountEl.textContent = `${
    TRUTH_PROMPTS.length + DARE_PROMPTS.length
  } Prompts Loaded`;

  const activeArray =
    appState.activeDeckTab === 'truths' ? TRUTH_PROMPTS : DARE_PROMPTS;
  listContainer.innerHTML = activeArray
    .map(
      (item, idx) => `
      <div class="prompt-item">
        <span class="prompt-index">${String(idx + 1).padStart(2, '0')}.</span>
        <span>${item}</span>
      </div>
    `
    )
    .join('');
}

/* ============================================================================
 * 9. THREE-FILE SOURCE CODE INSPECTOR (`index.html`, `style.css`, `script.js`)
 * ============================================================================ */
const sourceFilesCache = {
  'index.html': '',
  'style.css': '',
  'script.js': '',
};
let currentSelectedSourceFile = 'index.html';

async function loadSourceFileForInspector(fileName) {
  currentSelectedSourceFile = fileName;
  const codeDisplay = document.getElementById('source-code-display');
  if (!codeDisplay) return;

  if (sourceFilesCache[fileName]) {
    codeDisplay.textContent = sourceFilesCache[fileName];
    return;
  }

  try {
    const response = await fetch(`./${fileName}`);
    if (response.ok) {
      const text = await response.text();
      sourceFilesCache[fileName] = text;
      codeDisplay.textContent = text;
    } else {
      codeDisplay.textContent = `// Unable to fetch ./${fileName}`;
    }
  } catch {
    codeDisplay.textContent = `// Source file: ${fileName}`;
  }
}

/* ============================================================================
 * 10. EVENT LISTENERS & AUTO-JOIN ON `?room=` URL PARAMETER
 * ============================================================================ */
function bindEventListeners() {
  // Create Game Button
  document
    .getElementById('btn-create-game')
    .addEventListener('click', handleCreateGame);

  // Header "New Room" Button
  document
    .getElementById('btn-header-new-room')
    .addEventListener('click', handleCreateGame);

  // Brand Home Link
  document.getElementById('brand-home-link').addEventListener('click', (e) => {
    if (appState.roomCode) {
      e.preventDefault();
      handleLeaveRoom();
    }
  });

  // Join Room Form
  document
    .getElementById('join-room-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('input-room-code');
      await handleJoinRoom(input.value);
    });

  // Dismiss Error Banner
  document
    .getElementById('btn-dismiss-error')
    .addEventListener('click', hideErrorBanner);

  // Copy Invite Link Buttons (Lobby & In-Game)
  document
    .getElementById('btn-copy-invite')
    .addEventListener('click', copyInviteLinkToClipboard);
  document
    .getElementById('btn-copy-in-game')
    .addEventListener('click', copyInviteLinkToClipboard);

  // Open Player 2 in a New Browser Tab
  document
    .getElementById('btn-open-guest-tab')
    .addEventListener('click', () => {
      if (!appState.roomCode) return;
      const inviteUrl = buildInviteUrl(appState.roomCode);
      const anchor = document.createElement('a');
      anchor.href = inviteUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    });

  // Simulate Sibling Join (Single-Device Test Mode)
  document
    .getElementById('btn-simulate-sibling')
    .addEventListener('click', handleSimulateSiblingConnect);

  // Switch Player Perspective in Single-Device Mode
  document
    .getElementById('btn-switch-perspective')
    .addEventListener('click', () => {
      appState.localRole =
        appState.localRole === 'player1' ? 'player2' : 'player1';
      if (appState.roomData) {
        renderRoomUI(appState.roomData);
      }
    });

  // Leave Lobby / Leave Game
  document
    .getElementById('btn-leave-lobby')
    .addEventListener('click', handleLeaveRoom);
  document
    .getElementById('btn-leave-game')
    .addEventListener('click', handleLeaveRoom);

  // Truth & Dare Buttons
  document
    .getElementById('btn-truth')
    .addEventListener('click', () => handleSelectPrompt('truth'));
  document
    .getElementById('btn-dare')
    .addEventListener('click', () => handleSelectPrompt('dare'));

  // Next Turn Button
  document
    .getElementById('btn-next-turn')
    .addEventListener('click', handleNextTurn);

  // Sound Effects Toggle
  document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
    appState.soundEnabled = !appState.soundEnabled;
    e.currentTarget.textContent = `Sound Effects: ${
      appState.soundEnabled ? 'On' : 'Off'
    }`;
    if (appState.soundEnabled) playUiSound('tap');
  });

  // Deck Browser Tabs
  const tabTruths = document.getElementById('tab-deck-truths');
  const tabDares = document.getElementById('tab-deck-dares');

  tabTruths.addEventListener('click', () => {
    appState.activeDeckTab = 'truths';
    tabTruths.classList.add('active');
    tabTruths.setAttribute('aria-selected', 'true');
    tabDares.classList.remove('active');
    tabDares.setAttribute('aria-selected', 'false');
    renderPromptDeck();
  });

  tabDares.addEventListener('click', () => {
    appState.activeDeckTab = 'dares';
    tabDares.classList.add('active');
    tabDares.setAttribute('aria-selected', 'true');
    tabTruths.classList.remove('active');
    tabTruths.setAttribute('aria-selected', 'false');
    renderPromptDeck();
  });

  // Source File Inspector Tabs
  const sourceButtons = document.querySelectorAll('[data-source-file]');
  sourceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      sourceButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const fileName = btn.getAttribute('data-source-file');
      loadSourceFileForInspector(fileName);
    });
  });

  // Copy Source File Button
  document
    .getElementById('btn-copy-source-file')
    .addEventListener('click', async () => {
      const content =
        sourceFilesCache[currentSelectedSourceFile] ||
        document.getElementById('source-code-display').textContent;
      try {
        await navigator.clipboard.writeText(content);
        showToast(`Copied ${currentSelectedSourceFile}!`);
      } catch {
        showToast('Copied!');
      }
    });
}

/**
 * Bootstraps the application on DOMContentLoaded and checks for `?room=ABCDE`
 */
async function bootstrapApp() {
  initFirebaseDatabase();
  bindEventListeners();
  renderPromptDeck();
  loadSourceFileForInspector('index.html');

  // Automatically read `?room=` parameter when Player 2 opens the shared invite link
  const urlParams = new URLSearchParams(window.location.search);
  const invitedRoomCode = urlParams.get('room');

  if (invitedRoomCode) {
    const cleanCode = invitedRoomCode.trim().toUpperCase();
    document.getElementById('input-room-code').value = cleanCode;
    await handleJoinRoom(cleanCode);
  } else {
    renderSetupView();
  }
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
