
    const API_BASE = 'http://localhost:8080';

    // --- PHYSICAL ACOUSTIC WOOD PERCUSSION AUDIO ENGINE ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playWoodAcousticImpact(isCapture = false, isCheck = false) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;

      // 1. Transient piece-surface strike click
      const bufferSize = Math.floor(audioCtx.sampleRate * (isCapture ? 0.009 : 0.005));
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const clickFilter = audioCtx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(isCapture ? 1600 : 2200, now);
      clickFilter.Q.setValueAtTime(3.2, now);

      const clickGain = audioCtx.createGain();
      clickGain.gain.setValueAtTime(isCapture ? 0.28 : 0.18, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + (isCapture ? 0.035 : 0.025));

      noise.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(audioCtx.destination);
      noise.start(now);

      // 2. Resonant wood body oscillation (wooden board acoustic surface)
      const osc = audioCtx.createOscillator();
      const bodyGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isCapture ? 190 : 260, now);
      osc.frequency.exponentialRampToValueAtTime(isCapture ? 120 : 160, now + 0.05);

      bodyGain.gain.setValueAtTime(isCapture ? 0.22 : 0.15, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + (isCapture ? 0.075 : 0.05));

      osc.connect(bodyGain);
      bodyGain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);

      // 3. Optional crystalline check chime
      if (isCheck) {
        setTimeout(() => {
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const t = audioCtx.currentTime;
          const chime = audioCtx.createOscillator();
          const chimeGain = audioCtx.createGain();
          chime.type = 'sine';
          chime.frequency.setValueAtTime(880, t);
          chimeGain.gain.setValueAtTime(0.14, t);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          chime.connect(chimeGain);
          chimeGain.connect(audioCtx.destination);
          chime.start(t);
          chime.stop(t + 0.25);
        }, 35);
      }
    }

    const Sound = {
      move: () => playWoodAcousticImpact(false, false),
      capture: () => playWoodAcousticImpact(true, false),
      check: () => playWoodAcousticImpact(false, true),
      castle: () => {
        playWoodAcousticImpact(false, false);
        setTimeout(() => playWoodAcousticImpact(false, false), 80);
      },
      lowTime: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.03);
      },
      timeout: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      },
      undo: () => playWoodAcousticImpact(false, false),
      success: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.07);
          gain.gain.setValueAtTime(0.12, t + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.18);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t + idx * 0.07);
          osc.stop(t + idx * 0.07 + 0.19);
        });
      },
      wrong: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      }
    };

    const PIECE_IMAGES = {
      'wP': 'https://chessboardjs.com/img/chesspieces/wikipedia/wP.png',
      'wN': 'https://chessboardjs.com/img/chesspieces/wikipedia/wN.png',
      'wB': 'https://chessboardjs.com/img/chesspieces/wikipedia/wB.png',
      'wR': 'https://chessboardjs.com/img/chesspieces/wikipedia/wR.png',
      'wQ': 'https://chessboardjs.com/img/chesspieces/wikipedia/wQ.png',
      'wK': 'https://chessboardjs.com/img/chesspieces/wikipedia/wK.png',
      'bP': 'https://chessboardjs.com/img/chesspieces/wikipedia/bP.png',
      'bN': 'https://chessboardjs.com/img/chesspieces/wikipedia/bN.png',
      'bB': 'https://chessboardjs.com/img/chesspieces/wikipedia/bB.png',
      'bR': 'https://chessboardjs.com/img/chesspieces/wikipedia/bR.png',
      'bQ': 'https://chessboardjs.com/img/chesspieces/wikipedia/bQ.png',
      'bK': 'https://chessboardjs.com/img/chesspieces/wikipedia/bK.png'
    };

    let game = new Chess();
    let playerColor = 'w';
    let currentMode = 'larsen';
    let currentElo = 1500;
    let selectedSquare = null;
    let lastMoveSquares = [];
    let worstPieceSquare = null;
    let suggestedSquares = [];
    let isFlipped = false;

    // Navigation & Review
    let historyIndex = 0;
    let displayGame = null;
    let isReviewing = false;

    // Pre-move queue
    let premoveQueue = [];

    // Stockfish Line Auto-Play cache
    let cachedDemoStartFen = null;
    let cachedStockfishLine = [];
    let cachedEngineBestUci = null;
    let activeDemonstrationInterval = null;

    // Game History & Review Data
    let gameHistoryTracker = [];
    let fullGameReviewData = null;
    let activeTab = 'play';
    let cachedRecentGames = [];

    // Interactive Puzzle Mode state
    let isPuzzleModeActive = false;
    let activePuzzleBestUci = null;
    let activePuzzleStartFen = null;

    // Lichess Sandbox & MultiPV State
    let isLichessEngineOn = true;
    let lichessMultiPvCount = 3;
    let lichessDepth = 12;
    let multiPvCache = [];
    let variationTree = { fen: null, move: null, san: null, uci: null, children: [], parent: null, id: 'root', depth: 0, turn: 'b' };
    let currentVariationNode = variationTree;
    let variationIdCounter = 0;

    // Drawing state
    let rightClickStartSquare = null;
    let userDrawnArrows = []; // [{from, to, color}]
    let userDrawnHighlights = new Map(); // square -> color ('green', 'red', 'blue', 'yellow')

    // --- DUAL TOURNAMENT CLOCKS ENGINE (MONOTONIC PERFORMANCE.NOW) ---
    let timeControl = { base: 600, inc: 0 }; // 10 min Rapid default
    let whiteTimeMs = 600000;
    let blackTimeMs = 600000;
    let lastClockTimestamp = null;
    let clockIntervalId = null;
    let isClockRunning = false;
    let gameStatus = 'active'; // 'active', 'resigned', 'draw', 'timeout'
    let botMoveTimeoutId = null;
    let turnStartTime = performance.now();

    function setTimeControl(baseSec, incSec) {
      timeControl = { base: parseInt(baseSec), inc: parseInt(incSec) };
      whiteTimeMs = timeControl.base * 1000;
      blackTimeMs = timeControl.base * 1000;
      isClockRunning = false;
      if (clockIntervalId) clearInterval(clockIntervalId);
      clockIntervalId = null;
      updateClockUI();
    }

    function changeTimeControl(val) {
      const parts = val.split(',');
      setTimeControl(parts[0], parts[1]);
      resetGame();
    }

    function startClockIfNeeded() {
      if (timeControl.base <= 0) return;
      if (!isClockRunning && gameStatus === 'active') {
        isClockRunning = true;
        lastClockTimestamp = performance.now();
        if (clockIntervalId) clearInterval(clockIntervalId);
        clockIntervalId = setInterval(tickClock, 100);
      }
    }

    function tickClock() {
      if (!isClockRunning || gameStatus !== 'active' || game.game_over()) return;
      const now = performance.now();
      const delta = now - (lastClockTimestamp || now);
      lastClockTimestamp = now;

      const turn = game.turn();
      if (turn === 'w') {
        whiteTimeMs = Math.max(0, whiteTimeMs - delta);
      } else {
        blackTimeMs = Math.max(0, blackTimeMs - delta);
      }

      updateClockUI();

      if (whiteTimeMs <= 0 || blackTimeMs <= 0) {
        handleFlagFall(whiteTimeMs <= 0 ? 'w' : 'b');
      }
    }

    function switchClockTurn(completedMoveColor) {
      if (timeControl.base <= 0) return;
      if (completedMoveColor === 'w') {
        whiteTimeMs += timeControl.inc * 1000;
      } else {
        blackTimeMs += timeControl.inc * 1000;
      }
      lastClockTimestamp = performance.now();
      turnStartTime = lastClockTimestamp;
      startClockIfNeeded();
      updateClockUI();
    }

    function formatTimeDisplay(ms) {
      if (ms <= 0) return '0:00.0';
      const totalSec = ms / 1000;
      if (totalSec < 20) {
        // Decimal precision under 20 seconds
        const s = Math.floor(totalSec);
        const d = Math.floor((ms % 1000) / 100);
        return `${s}.${d}`;
      }
      const mins = Math.floor(totalSec / 60);
      const secs = Math.floor(totalSec % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateClockUI() {
      const topTimerEl = document.getElementById('topTimer');
      const bottomTimerEl = document.getElementById('bottomTimer');
      if (!topTimerEl || !bottomTimerEl) return;

      if (timeControl.base <= 0) {
        topTimerEl.innerText = '∞';
        bottomTimerEl.innerText = '∞';
        topTimerEl.className = 'timer';
        bottomTimerEl.className = 'timer';
        return;
      }

      const isBotWhite = (playerColor !== 'w');
      const botTime = isBotWhite ? whiteTimeMs : blackTimeMs;
      const userTime = isBotWhite ? blackTimeMs : whiteTimeMs;

      topTimerEl.innerText = formatTimeDisplay(botTime);
      bottomTimerEl.innerText = formatTimeDisplay(userTime);

      const turn = game.turn();
      const isUserTurn = (turn === playerColor);

      bottomTimerEl.className = 'timer' + (isUserTurn && isClockRunning ? ' timer-active' : '') + (userTime < 20000 ? ' timer-low' : '');
      topTimerEl.className = 'timer' + (!isUserTurn && isClockRunning ? ' timer-active' : '') + (botTime < 20000 ? ' timer-low' : '');

      if (isUserTurn && isClockRunning && userTime < 5000 && userTime > 500 && Math.floor(userTime / 1000) !== Math.floor((userTime + 100) / 1000)) {
        Sound.lowTime();
      }
    }

    function handleFlagFall(loserColor) {
      isClockRunning = false;
      if (clockIntervalId) clearInterval(clockIntervalId);
      gameStatus = 'timeout';
      Sound.timeout();

      const winnerColor = loserColor === 'w' ? 'b' : 'w';
      const winnerName = (winnerColor === playerColor) ? 'You' : 'Stockfish 19';
      const loserName = (loserColor === playerColor) ? 'You' : 'Stockfish 19';

      alert(`⏰ Time Out! ${loserName} ran out of time. ${winnerName} wins on time!`);
      updateClockUI();
    }

    function playerResign() {
      if (game.game_over() || gameStatus !== 'active') return;
      if (confirm("Are you sure you want to resign this match?")) {
        isClockRunning = false;
        gameStatus = 'resigned';
        Sound.wrong();
        alert("Match resigned. Stockfish 19 wins by resignation.");
        updateClockUI();
      }
    }

    async function playerOfferDraw() {
      if (game.game_over() || gameStatus !== 'active') return;
      try {
        const resp = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: game.fen(), depth: 14 })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.is_mate) {
            alert(`Stockfish declines your draw offer! Stockfish has a forced mate!`);
            return;
          }
          const evalCp = data.score_cp;
          const moveCount = Math.floor(game.history().length / 2);
          if (Math.abs(evalCp) <= 50 && moveCount > 40) {
            alert("Stockfish evaluated the position: Stockfish accepts your draw offer.");
            gameStatus = 'draw';
            if (clockIntervalId) clearInterval(clockIntervalId);
            handleGameOver();
          } else {
            const evalNum = (evalCp / 100).toFixed(1);
            alert(`Stockfish evaluated the position: Stockfish declines your draw offer! (Eval: ${evalNum})`);
          }
        }
      } catch (err) {
        alert("Stockfish declined your draw offer.");
      }
    }

    // --- FLOATING TARGET-SQUARE PROMOTION HUD ---
    let pendingPromotion = null; // { from, to, color, moves }

    function checkPawnPromotion(fromSq, toSq) {
      const active = getActiveGame();
      const piece = active.get(fromSq);
      if (!piece || piece.type !== 'p') return false;
      const targetRank = toSq[1];
      if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
        const moves = active.moves({ square: fromSq, verbose: true });
        const validPromo = moves.filter(m => m.to === toSq && m.promotion);
        if (validPromo.length > 0) {
          showPromotionHUD(fromSq, toSq, piece.color, validPromo);
          return true;
        }
      }
      return false;
    }

    function showPromotionHUD(fromSq, toSq, color, validMoves) {
      pendingPromotion = { from: fromSq, to: toSq, color: color, moves: validMoves };
      const modal = document.getElementById('promotionModal');
      modal.innerHTML = '';
      
      const pieces = ['q', 'n', 'r', 'b'];
      pieces.forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'promotion-piece-btn';
        btn.title = `Promote to ${p.toUpperCase()} (Hotkey: ${p.toUpperCase()})`;
        const imgKey = color + p.toUpperCase();
        btn.innerHTML = `<img src="${PIECE_IMAGES[imgKey]}" alt="${p}">`;
        btn.onclick = (e) => {
          e.stopPropagation();
          completePromotion(p);
        };
        modal.appendChild(btn);
      });

      // Position directly over target square
      const center = getSquareCenter(toSq);
      modal.style.left = `${Math.max(10, center.x - 26)}px`;
      modal.style.top = `${Math.max(10, center.y - 110)}px`;
      modal.style.display = 'flex';
    }

    function hidePromotionHUD() {
      const modal = document.getElementById('promotionModal');
      if (modal) modal.style.display = 'none';
      pendingPromotion = null;
    }

    function completePromotion(pieceType) {
      if (!pendingPromotion) return;
      const { from, to, color, moves } = pendingPromotion;
      const chosenMove = moves.find(m => m.promotion === pieceType) || { from, to, promotion: pieceType };
      hidePromotionHUD();

      if (isPuzzleModeActive) {
        commitPuzzleMove(chosenMove);
      } else if (isVaultModeActive) {
        commitVaultMove(chosenMove);
      } else if (activeTab === 'lichess') {
        const active = getActiveGame();
        const res = active.move(chosenMove);
        if (res) {
          if (res.captured) Sound.capture();
          else if (res.san.includes('+')) Sound.check();
          else Sound.move();
          lastMoveSquares = [res.from, res.to];
          addVariationMove(res, active);
          clearSelection();
          renderPieces();
          queryMultiPvAnalysis();
        }
      } else {
        commitPlayerMove(chosenMove);
      }
    }

    // --- BLUNDER VAULT CONTROLLER (PERSONALIZED WEAKNESS EXTRACTOR) ---
    let vaultPuzzles = [];
    let currentVaultIndex = 0;
    let isVaultModeActive = false;
    let activeVaultPuzzle = null;
    let vaultMasteredIds = new Set(JSON.parse(localStorage.getItem('vault_mastered') || '[]'));

    async function loadBlunderVaultData() {
      try {
        const resp = await fetch(`${API_BASE}/api/blunder_vault`);
        if (resp.ok) {
          vaultPuzzles = await resp.json();
          renderVaultPuzzlesList(vaultPuzzles);
          updateVaultStats();
          if (vaultPuzzles.length > 0 && !activeVaultPuzzle) {
            selectVaultPuzzle(0);
          } else if (activeVaultPuzzle) {
            queryVaultStockfishAnalysis(currentVaultMode === 'calc');
          }
        }
      } catch (err) {
        console.error("Error loading blunder vault:", err);
      }
    }

    function renderVaultPuzzlesList(list) {
      const container = document.getElementById('vaultPuzzlesList');
      if (!container) return;
      container.innerHTML = '';

      list.forEach((p, idx) => {
        const card = document.createElement('div');
        const isMastered = vaultMasteredIds.has(p.id);
        const isActive = (idx === currentVaultIndex && isVaultModeActive);
        card.className = `vault-puzzle-item ${isActive ? 'active' : ''}`;
        card.style.cssText = `
          padding: 8px 12px;
          background: ${isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)'};
          border: 1px solid ${isActive ? 'var(--accent-amber)' : 'rgba(255,255,255,0.08)'};
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.15s ease;
        `;
        card.onclick = () => selectVaultPuzzle(idx);

        card.innerHTML = `
          <div>
            <div style="font-weight:700; font-size:0.8rem;">vs ${p.opponent} • Move ${p.move_num}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); display:flex; gap:6px; margin-top:2px;">
              <span style="color:${p.win_loss >= 40 ? 'var(--accent-rose)' : 'var(--accent-amber)'};">Blunder: ${p.user_blunder_san} (-${p.win_loss}%)</span>
              <span>•</span>
              <span>${p.theme}</span>
            </div>
          </div>
          <div>
            <span style="font-size:0.72rem; padding:2px 8px; border-radius:999px; font-weight:700; background:${isMastered ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; color:${isMastered ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
              ${isMastered ? '✅ Mastered' : '❌ Unsolved'}
            </span>
          </div>
        `;
        container.appendChild(card);
      });
    }

    function selectVaultPuzzle(idx) {
      currentVaultIndex = idx;
      activeVaultPuzzle = vaultPuzzles[idx];
      if (!activeVaultPuzzle) return;

      isVaultModeActive = true;
      isPuzzleModeActive = false;

      displayGame = new Chess();
      displayGame.load(activeVaultPuzzle.fen_before);
      playerColor = activeVaultPuzzle.player_color;
      isReviewing = true;

      document.getElementById('vaultPromptText').innerHTML = `
        In your Rapid game vs <strong>${activeVaultPuzzle.opponent}</strong>, you played <span style="color:var(--accent-rose); font-weight:700;">${activeVaultPuzzle.user_blunder_san}</span> on Move ${activeVaultPuzzle.move_num} (losing ${activeVaultPuzzle.win_loss}% win prob).<br>
        <strong>Find the Grandmaster move on the board!</strong>
      `;
      document.getElementById('vaultDrillBadge').innerText = '';
      document.getElementById('vaultLessonText').style.display = 'none';

      clearSelection();
      setEngineArrow(null);
      lastMoveSquares = [];
      renderPieces();
      renderVaultPuzzlesList(vaultPuzzles);
      queryVaultStockfishAnalysis(currentVaultMode === 'calc');
    }

    let currentVaultMode = 'tactics';
    let calculationLine = [];

    function setVaultMode(mode) {
      currentVaultMode = mode;
      document.getElementById('vm-tactics').classList.toggle('active', mode === 'tactics');
      document.getElementById('vm-calc').classList.toggle('active', mode === 'calc');
      
      const calcDisplay = document.getElementById('calculationMovesDisplay');
      const submitBtn = document.getElementById('btnVaultSubmitLine');
      
      if (mode === 'calc') {
        calcDisplay.style.display = 'block';
        submitBtn.style.display = 'inline-block';
        calculationLine = [];
        calcDisplay.innerText = "Line: ";
        if (activeVaultPuzzle) {
          displayGame = new Chess(activeVaultPuzzle.fen_before);
          renderPieces();
          queryVaultStockfishAnalysis(true);
        }
      } else {
        calcDisplay.style.display = 'none';
        submitBtn.style.display = 'none';
        if (activeVaultPuzzle) {
          displayGame = new Chess(activeVaultPuzzle.fen_before);
          renderPieces();
          queryVaultStockfishAnalysis(false);
        }
      }
    }

    async function queryVaultStockfishAnalysis(showBestLine = false) {
      if (!activeVaultPuzzle) return;
      const activeFen = displayGame ? displayGame.fen() : activeVaultPuzzle.fen_before;
      if (!activeFen) return;

      try {
        const resp = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: activeFen, depth: 12, multipv: 1 })
        });

        if (resp.ok) {
          const data = await resp.json();
          updateVerticalEvalUI(data);

          const isCalc = (currentVaultMode === 'calc');
          if (isCalc || showBestLine) {
            const cls = data.is_mate
              ? `Mate in ${Math.abs(data.mate_in)}`
              : (data.score_cp >= 200 ? 'Winning Advantage' : (data.score_cp <= -200 ? 'Disadvantage' : 'Balanced Position'));

            renderCoachPillars({
              classification: cls,
              principle: activeVaultPuzzle.theme || "Tactical Calculation & Vision",
              why_it_works: `Stockfish evaluates this position at ${data.is_mate ? ('Mate in ' + data.mate_in) : ((data.score_cp / 100).toFixed(1) + ' advantage')}. Target unprotected pieces and king exposure.`,
              rule_of_thumb: "When calculating variations, look for the most forcing moves: Checks, Captures, and Threats.",
              engine_best: data.bestmove,
              engine_pv: data.pv || [data.bestmove],
              stockfish_note: `Live calculation: ${data.pv && data.pv.length > 0 ? data.pv.slice(0, 6).join('  ➔  ') : (data.bestmove || 'None')}`
            }, activeFen);

            if (data.bestmove && data.bestmove.length >= 4) {
              setEngineArrow(data.bestmove.substring(0, 2), data.bestmove.substring(2, 4), 'blue');
            }
          } else {
            renderCoachPillars({
              classification: "Tactical Drill",
              principle: activeVaultPuzzle.theme || "Blunder Rehabilitation",
              why_it_works: `You played ${activeVaultPuzzle.user_blunder_san} in your game (losing ${activeVaultPuzzle.win_loss}% win probability). Find the Grandmaster move!`,
              rule_of_thumb: "Execute your 2-second blunder check before each move: is your target square defended?",
              engine_best: null,
              engine_pv: [],
              stockfish_note: "Live Stockfish 19 engine is analyzing this position. Make your move on the board!"
            }, activeFen);
            setEngineArrow(null);
          }
        }
      } catch (err) {
        console.warn("Vault engine analysis error:", err);
      }
    }

    function commitVaultMove(move) {
      if (!activeVaultPuzzle) return;
      
      if (currentVaultMode === 'calc') {
        const res = displayGame.move(move);
        if (res) {
          calculationLine.push(res.san);
          document.getElementById('calculationMovesDisplay').innerText = "Line: " + calculationLine.join(" ");
          lastMoveSquares = [move.from, move.to];
          renderPieces();
          Sound.move();
          queryVaultStockfishAnalysis(true);
        }
        return;
      }

      // Tactics mode logic
      const uciPlayed = `${move.from}${move.to}${move.promotion || ''}`;
      const bestUci = activeVaultPuzzle.best_move_uci;

      if (uciPlayed === bestUci) {
        Sound.success();
        document.getElementById('vaultDrillBadge').innerHTML = '<span style="color:var(--accent-emerald); font-weight:800;">🎉 Brilliant! Solved!</span>';
        document.getElementById('vaultLessonText').style.display = 'block';
        document.getElementById('vaultLessonText').innerHTML = `<strong>Grandmaster Lesson:</strong> ${activeVaultPuzzle.coach_lesson}`;
        
        vaultMasteredIds.add(activeVaultPuzzle.id);
        localStorage.setItem('vault_mastered', JSON.stringify(Array.from(vaultMasteredIds)));
        updateVaultStats();

        displayGame.move(move);
        lastMoveSquares = [move.from, move.to];
        renderPieces();
        renderVaultPuzzlesList(vaultPuzzles);
        queryVaultStockfishAnalysis(true);
      } else {
        Sound.wrong();
        document.getElementById('vaultDrillBadge').innerHTML = '<span style="color:var(--accent-rose); font-weight:700;">❌ Not the best move. Try again!</span>';
        queryVaultStockfishAnalysis(false);
      }
    }

    function submitCalculationLine() {
      if (!activeVaultPuzzle || calculationLine.length === 0) return;
      
      const firstSan = calculationLine[0];
      const tempGame = new Chess(activeVaultPuzzle.fen_before);
      const moves = tempGame.moves({verbose: true});
      const bestUci = activeVaultPuzzle.best_move_uci;
      
      // Check if their first move matches the best move
      const playedFirstMove = tempGame.move(firstSan);
      const playedFirstUci = `${playedFirstMove.from}${playedFirstMove.to}${playedFirstMove.promotion || ''}`;

      if (playedFirstUci === bestUci) {
        if (calculationLine.length >= 3) {
          Sound.success();
          document.getElementById('vaultDrillBadge').innerHTML = '<span style="color:var(--accent-emerald); font-weight:800;">🎉 Incredible Calculation! You found the deep line!</span>';
          document.getElementById('vaultLessonText').style.display = 'block';
          document.getElementById('vaultLessonText').innerHTML = `<strong>Grandmaster Lesson:</strong> ${activeVaultPuzzle.coach_lesson}`;
          
          vaultMasteredIds.add(activeVaultPuzzle.id);
          localStorage.setItem('vault_mastered', JSON.stringify(Array.from(vaultMasteredIds)));
          updateVaultStats();
          renderVaultPuzzlesList(vaultPuzzles);
          queryVaultStockfishAnalysis(true);
        } else {
          Sound.wrong();
          document.getElementById('vaultDrillBadge').innerHTML = '<span style="color:var(--accent-amber); font-weight:700;">⚠️ The first move is correct, but calculation requires at least 3 plies (moves). Keep calculating!</span>';
        }
      } else {
        Sound.wrong();
        document.getElementById('vaultDrillBadge').innerHTML = '<span style="color:var(--accent-rose); font-weight:700;">❌ The critical first move in your line is incorrect. Try calculating again.</span>';
      }
    }

    function showVaultHint() {
      if (!activeVaultPuzzle) return;
      const fromSq = activeVaultPuzzle.best_move_uci.substring(0, 2);
      clearSelection();
      selectSquare(fromSq);
      document.getElementById('vaultDrillBadge').innerHTML = `<span style="color:var(--accent-purple); font-weight:600;">Hint: Move the piece on ${fromSq.toUpperCase()}</span>`;
      queryVaultStockfishAnalysis(false);
    }

    function revealVaultSolution() {
      if (!activeVaultPuzzle) return;
      const fromSq = activeVaultPuzzle.best_move_uci.substring(0, 2);
      const toSq = activeVaultPuzzle.best_move_uci.substring(2, 4);
      setEngineArrow(fromSq, toSq, 'blue');
      document.getElementById('vaultDrillBadge').innerHTML = `<span style="color:var(--accent-cyan); font-weight:700;">Solution: ${activeVaultPuzzle.best_move_uci}</span>`;
      document.getElementById('vaultLessonText').style.display = 'block';
      document.getElementById('vaultLessonText').innerHTML = `<strong>Grandmaster Lesson:</strong> ${activeVaultPuzzle.coach_lesson}`;
      queryVaultStockfishAnalysis(true);
    }

    function loadNextVaultPuzzle() {
      if (vaultPuzzles.length === 0) return;
      const nextIdx = (currentVaultIndex + 1) % vaultPuzzles.length;
      selectVaultPuzzle(nextIdx);
    }

    function updateVaultStats() {
      const badge = document.getElementById('vaultStatsBadge');
      if (badge) {
        badge.innerText = `${vaultMasteredIds.size} / ${vaultPuzzles.length} Mastered`;
      }
    }

    function filterVaultPuzzles(theme) {
      document.querySelectorAll('.vault-filter-row .selector-btn').forEach(b => b.classList.remove('active'));
      if (theme === 'all') {
        document.getElementById('vf-all').classList.add('active');
        renderVaultPuzzlesList(vaultPuzzles);
      } else {
        const filtered = vaultPuzzles.filter(p => p.theme.toLowerCase().includes(theme.toLowerCase()));
        renderVaultPuzzlesList(filtered);
      }
    }

    function initBoard() {
      const boardEl = document.getElementById('board');
      boardEl.innerHTML = '';

      const flipped = isFlipped;
      const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
      const files = flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

      for (let r of ranks) {
        for (let f of files) {
          const squareName = f + r;
          const squareEl = document.createElement('div');
          const isLight = (f.charCodeAt(0) - 97 + r) % 2 !== 0;
          squareEl.className = `square ${isLight ? 'light' : 'dark'}`;
          squareEl.dataset.square = squareName;

          if ((!flipped && f === 'a') || (flipped && f === 'h')) {
            const rankCoord = document.createElement('span');
            rankCoord.className = 'coord rank';
            rankCoord.innerText = r;
            squareEl.appendChild(rankCoord);
          }
          if ((!flipped && r === 1) || (flipped && r === 8)) {
            const fileCoord = document.createElement('span');
            fileCoord.className = 'coord file';
            fileCoord.innerText = f;
            squareEl.appendChild(fileCoord);
          }

          const heatmapEl = document.createElement('div');
          heatmapEl.className = 'heatmap-cell';
          squareEl.appendChild(heatmapEl);

          squareEl.addEventListener('mousedown', (e) => handleSquareMouseDown(e, squareName));
          squareEl.addEventListener('mouseup', (e) => handleSquareMouseUp(e, squareName));
          boardEl.appendChild(squareEl);
        }
      }
      renderPieces();
    }

    function getActiveGame() {
      return isReviewing && displayGame ? displayGame : game;
    }

    // --- DRAWING ENGINE WITH MODIFIER KEYS ---
    function handleSquareMouseDown(e, square) {
      if (e.button === 0) {
        if (userDrawnArrows.length > 0 || userDrawnHighlights.size > 0) {
          clearUserArrows();
        }
        handleSquareClick(square);
      } else if (e.button === 2) {
        rightClickStartSquare = square;
      }
    }

    function handleSquareMouseUp(e, square) {
      if (e.button === 2 && rightClickStartSquare) {
        let drawColor = 'green';
        if (e.shiftKey) drawColor = 'red';
        else if (e.altKey) drawColor = 'blue';
        else if (e.ctrlKey || e.metaKey) drawColor = 'yellow';

        if (rightClickStartSquare === square) {
          if (userDrawnHighlights.has(square)) {
            userDrawnHighlights.delete(square);
          } else {
            userDrawnHighlights.set(square, drawColor);
          }
        } else {
          const existingIdx = userDrawnArrows.findIndex(a => a.from === rightClickStartSquare && a.to === square);
          if (existingIdx >= 0) {
            userDrawnArrows.splice(existingIdx, 1);
          } else {
            userDrawnArrows.push({ from: rightClickStartSquare, to: square, color: drawColor });
          }
        }
        rightClickStartSquare = null;
        redrawAllArrows();
        renderPieces();
      }
    }

    // --- DRAG AND DROP & TOUCH SUPPORT ---
    let isDragging = false;
    let dragPieceEl = null;
    let dragStartSquare = null;
    let dragGhostEl = null;

    const boardContainer = document.getElementById('board');

    boardContainer.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      
      const pieceEl = e.target.closest('.piece');
      if (!pieceEl) return;
      
      const squareEl = pieceEl.closest('.square');
      if (!squareEl) return;

      e.preventDefault(); 
      dragStartSquare = squareEl.dataset.square;
      
      if (userDrawnArrows.length > 0 || userDrawnHighlights.size > 0) {
        clearUserArrows();
      }
      handleSquareClick(dragStartSquare);

      isDragging = true;
      dragPieceEl = pieceEl;
      
      dragPieceEl.style.opacity = '0.3';
      
      dragGhostEl = document.createElement('div');
      dragGhostEl.className = 'piece drag-ghost';
      dragGhostEl.style.backgroundImage = dragPieceEl.style.backgroundImage;
      dragGhostEl.style.position = 'fixed';
      dragGhostEl.style.pointerEvents = 'none';
      dragGhostEl.style.zIndex = '9999';
      
      const rect = dragPieceEl.getBoundingClientRect();
      dragGhostEl.style.width = (rect.width * 1.1) + 'px';
      dragGhostEl.style.height = (rect.height * 1.1) + 'px';
      dragGhostEl.style.backgroundSize = 'contain';
      dragGhostEl.style.backgroundRepeat = 'no-repeat';
      dragGhostEl.style.backgroundPosition = 'center';
      dragGhostEl.style.opacity = '0.85';
      
      document.body.appendChild(dragGhostEl);
      updateGhostPosition(e.clientX, e.clientY);
    });

    document.addEventListener('pointermove', (e) => {
      if (!isDragging || !dragGhostEl) return;
      updateGhostPosition(e.clientX, e.clientY);
    });

    document.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      
      if (dragPieceEl) {
        dragPieceEl.style.opacity = '';
      }
      if (dragGhostEl && dragGhostEl.parentNode) {
        dragGhostEl.parentNode.removeChild(dragGhostEl);
      }
      
      isDragging = false;
      dragGhostEl = null;
      const startSq = dragStartSquare;
      dragStartSquare = null;
      dragPieceEl = null;

      const targetSquare = getSquareFromEvent(e);
      if (targetSquare && targetSquare !== startSq) {
        handleSquareClick(targetSquare);
      }
    });

    function updateGhostPosition(x, y) {
      if (!dragGhostEl) return;
      const width = parseFloat(dragGhostEl.style.width);
      const height = parseFloat(dragGhostEl.style.height);
      dragGhostEl.style.left = (x - width / 2) + 'px';
      dragGhostEl.style.top = (y - height / 2) + 'px';
    }

    function getSquareFromEvent(e) {
      const boardEl = document.getElementById('board');
      const boardRect = boardEl.getBoundingClientRect();
      
      if (
        e.clientX < boardRect.left ||
        e.clientX > boardRect.right ||
        e.clientY < boardRect.top ||
        e.clientY > boardRect.bottom
      ) {
        return null;
      }
      
      const sqSize = boardRect.width / 8;
      const col = Math.floor((e.clientX - boardRect.left) / sqSize);
      const row = Math.floor((e.clientY - boardRect.top) / sqSize);
      
      const fileIndex = isFlipped ? 7 - col : col;
      const rankIndex = isFlipped ? row : 7 - row;
      
      if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) return null;
      
      const files = ['a','b','c','d','e','f','g','h'];
      return files[fileIndex] + (rankIndex + 1);
    }

    function clearUserArrows() {
      userDrawnArrows = [];
      userDrawnHighlights.clear();
      redrawAllArrows();
      renderPieces();
    }

    function getSquareCenter(sq) {
      const file = sq.charCodeAt(0) - 97;
      const rank = parseInt(sq[1]) - 1;
      
      const col = isFlipped ? (7 - file) : file;
      const row = isFlipped ? rank : (7 - rank);
      
      const boardEl = document.getElementById('board');
      const size = boardEl.clientWidth;
      const sqSize = size / 8;
      
      return {
        x: (col + 0.5) * sqSize,
        y: (row + 0.5) * sqSize,
        sqSize: sqSize
      };
    }

    let engineArrow = null; // {from, to, color}

    function setEngineArrow(fromSq, toSq, color = 'blue') {
      engineArrow = (fromSq && toSq && fromSq !== toSq) ? { from: fromSq, to: toSq, color } : null;
      redrawAllArrows();
    }

    function redrawAllArrows() {
      const svg = document.getElementById('boardArrows');
      svg.querySelectorAll('line').forEach(l => l.remove());

      if (engineArrow) {
        drawSvgLine(svg, engineArrow.from, engineArrow.to, 
          engineArrow.color === 'red' ? 'rgba(239, 68, 68, 0.92)' : 'rgba(37, 99, 235, 0.92)', 
          engineArrow.color === 'red' ? 'url(#arrowhead-red)' : 'url(#arrowhead-blue)');
      }

      for (let arr of userDrawnArrows) {
        let strokeColor = 'rgba(34, 197, 94, 0.88)';
        let marker = 'url(#arrowhead-green)';
        if (arr.color === 'red') { strokeColor = 'rgba(239, 68, 68, 0.88)'; marker = 'url(#arrowhead-red)'; }
        else if (arr.color === 'blue') { strokeColor = 'rgba(37, 99, 235, 0.88)'; marker = 'url(#arrowhead-blue)'; }
        else if (arr.color === 'yellow') { strokeColor = 'rgba(234, 179, 8, 0.88)'; marker = 'url(#arrowhead-yellow)'; }
        drawSvgLine(svg, arr.from, arr.to, strokeColor, marker);
      }
    }

    function drawSvgLine(svg, fromSq, toSq, color, markerUrl) {
      const p1 = getSquareCenter(fromSq);
      const p2 = getSquareCenter(toSq);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;

      const shorten = p2.sqSize * 0.28;
      const endX = p2.x - (dx / dist) * shorten;
      const endY = p2.y - (dy / dist) * shorten;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', endY);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', Math.max(7, p1.sqSize * 0.15));
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('marker-end', markerUrl);

      svg.appendChild(line);
    }

    function renderPieces() {
      const active = getActiveGame();

      document.querySelectorAll('.square').forEach(sq => {
        const pieceEl = sq.querySelector('.piece');
        if (pieceEl) pieceEl.remove();
        const hintEl = sq.querySelector('.move-hint, .capture-hint');
        if (hintEl) hintEl.remove();
        
        sq.classList.remove('selected', 'last-move', 'threatened', 'worst-piece', 'suggested', 'premove', 'hl-green', 'hl-red', 'hl-blue', 'hl-yellow');
        
        const sqName = sq.dataset.square;
        if (lastMoveSquares.includes(sqName)) sq.classList.add('last-move');
        if (worstPieceSquare === sqName) sq.classList.add('worst-piece');
        if (suggestedSquares.includes(sqName)) sq.classList.add('suggested');

        if (userDrawnHighlights.has(sqName)) {
          const c = userDrawnHighlights.get(sqName);
          sq.classList.add(`hl-${c}`);
        }

        if (premoveQueue.some(pm => pm.from === sqName || pm.to === sqName)) {
          sq.classList.add('premove');
        }
      });

      for (let r = 1; r <= 8; r++) {
        for (let f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
          const sqName = f + r;
          const piece = active.get(sqName);
          if (piece) {
            const pieceKey = piece.color + piece.type.toUpperCase();
            const sqEl = document.querySelector(`.square[data-square="${sqName}"]`);
            if (sqEl) {
              const pImg = document.createElement('div');
              pImg.className = 'piece';
              pImg.style.backgroundImage = `url('${PIECE_IMAGES[pieceKey]}')`;
              sqEl.appendChild(pImg);
            }
          }
        }
      }

      updateMoveListUI();
      if (!isReviewing && activeTab === 'play') {
        queryStockfishAnalysis();
      }
      
      if (activeTab === 'lichess') {
        updateOpeningExplorer(active.fen());
      }
    }

    async function updateOpeningExplorer(fen) {
      if (activeTab !== 'lichess') return;
      try {
        const resp = await fetch(`${API_BASE}/api/opening_explorer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: fen })
        });
        if (resp.ok) {
          const data = await resp.json();
          document.getElementById('oeOpeningName').innerText = data.opening;
          document.getElementById('oeWinStats').innerText = `Win ${data.stats.win}% | Draw ${data.stats.draw}% | Loss ${data.stats.loss}%`;
        }
      } catch (err) {
        console.error("Error updating opening explorer:", err);
      }
    }

    async function generateScoutingReport() {
      const pgns = document.getElementById('opponentPgns').value;
      if (!pgns.trim()) {
        alert('Please paste some PGNs first.');
        return;
      }
      try {
        const resp = await fetch(`${API_BASE}/api/opponent_prep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pgns: pgns })
        });
        if (resp.ok) {
          const data = await resp.json();
          document.getElementById('srOpening').innerText = data.most_frequent_opening;
          document.getElementById('srLength').innerText = data.average_game_length + " moves";
          document.getElementById('srWeakness').innerText = data.tactical_weakness;
          document.getElementById('scoutingReportCard').style.display = 'block';
        }
      } catch (err) {
        console.error("Error generating scouting report:", err);
      }
    }

    // --- TAB SWITCHER LOGIC ---
    function switchDashboardTab(tab) {
      document.getElementById('reviewBanner').classList.remove('active');
      setEngineArrow(null);
      activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');

      document.getElementById('panel-play').classList.toggle('hidden', tab !== 'play');
      document.getElementById('panel-review').classList.toggle('active', tab === 'review');
      document.getElementById('panel-lichess').classList.toggle('active', tab === 'lichess');
      const vaultEl = document.getElementById('panel-vault');
      if (vaultEl) vaultEl.style.display = (tab === 'vault') ? 'block' : 'none';
      const prepEl = document.getElementById('panel-prep');
      if (prepEl) prepEl.style.display = (tab === 'prep') ? 'flex' : 'none';

      if (tab === 'review') {
        isVaultModeActive = false;
        loadRecentGamesDropdown();
        if (!fullGameReviewData && game.history().length > 0) {
          runFullGameReview();
        } else if (fullGameReviewData) {
          renderFullGameReview(fullGameReviewData);
        }
      } else if (tab === 'lichess') {
        isVaultModeActive = false;
        queryMultiPvAnalysis();
      } else if (tab === 'vault') {
        loadBlunderVaultData();
      } else if (tab === 'play') {
        isVaultModeActive = false;
        jumpToLivePosition();
      }
    }

    // --- MOVE CLICK & EXECUTION ---
    function handleSquareClick(square) {
      // 0. If in Blunder Vault Mode
      if (isVaultModeActive) {
        handleVaultSquareClick(square);
        return;
      }

      // 1. If in Puzzle Mode
      if (isPuzzleModeActive) {
        handlePuzzleSquareClick(square);
        return;
      }

      // 2. If in Lichess Free-Play Sandbox
      if (activeTab === 'lichess') {
        handleSandboxSquareClick(square);
        return;
      }

      // 3. If in normal review mode
      if (isReviewing) {
        jumpToLivePosition();
        return;
      }

      if (game.game_over() || gameStatus !== 'active') return;

      const isUserTurn = (game.turn() === playerColor);
      const piece = game.get(square);

      if (isUserTurn) {
        if (selectedSquare) {
          if (selectedSquare === square) {
            clearSelection();
            return;
          }

          // Check for Pawn Promotion Interception
          if (checkPawnPromotion(selectedSquare, square)) {
            clearSelection();
            return;
          }

          const moves = game.moves({ square: selectedSquare, verbose: true });
          const validMove = moves.find(m => m.to === square);

          if (validMove) {
            commitPlayerMove(validMove);
            clearSelection();
            return;
          } else if (piece && piece.color === playerColor) {
            selectSquare(square);
            return;
          } else {
            clearSelection();
            return;
          }
        }

        if (piece && piece.color === playerColor) {
          selectSquare(square);
        }
      } else {
        handlePremoveClick(square, piece);
      }
    }

    function handleVaultSquareClick(square) {
      if (!isVaultModeActive || !displayGame) return;
      const active = displayGame;
      const piece = active.get(square);
      const turn = active.turn();

      if (selectedSquare) {
        if (selectedSquare === square) {
          clearSelection();
          return;
        }

        if (checkPawnPromotion(selectedSquare, square)) {
          clearSelection();
          return;
        }

        const moves = active.moves({ square: selectedSquare, verbose: true });
        const validMove = moves.find(m => m.to === square);
        if (validMove) {
          clearSelection();
          commitVaultMove(validMove);
          return;
        } else if (piece && piece.color === turn) {
          selectSquare(square);
          return;
        } else {
          clearSelection();
          return;
        }
      }

      if (piece && piece.color === turn) {
        selectSquare(square);
      }
    }

    function handleSandboxSquareClick(square) {
      const active = getActiveGame();
      const piece = active.get(square);
      const turn = active.turn();

      if (selectedSquare) {
        if (selectedSquare === square) {
          clearSelection();
          return;
        }

        if (checkPawnPromotion(selectedSquare, square)) {
          clearSelection();
          return;
        }

        const moves = active.moves({ square: selectedSquare, verbose: true });
        const validMove = moves.find(m => m.to === square);

        if (validMove) {
          const res = active.move(validMove);
          if (res) {
            if (res.captured) Sound.capture();
            else if (res.san === 'O-O' || res.san === 'O-O-O') Sound.castle();
            else if (res.san.includes('+')) Sound.check();
            else Sound.move();

            lastMoveSquares = [res.from, res.to];
            addVariationMove(res, active);
            clearSelection();
            renderPieces();
            queryMultiPvAnalysis();
          }
          return;
        } else if (piece && piece.color === turn) {
          selectSquare(square);
          return;
        } else {
          clearSelection();
          return;
        }
      }

      if (piece && piece.color === turn) {
        selectSquare(square);
      }
    }

    function handlePremoveClick(square, piece) {
      if (selectedSquare) {
        if (selectedSquare === square) {
          clearSelection();
          return;
        }
        if (piece && piece.color === playerColor) {
          clearSelection();
          selectedSquare = square;
          const sqEl = document.querySelector(`.square[data-square="${square}"]`);
          if (sqEl) sqEl.classList.add('selected');
          return;
        }
        let prom = undefined;
        const active = getActiveGame();
        const movingPiece = active.get(selectedSquare);
        if (movingPiece && movingPiece.type === 'p' && (square[1] === '8' || square[1] === '1')) {
          prom = 'q';
        }
        premoveQueue.push({ from: selectedSquare, to: square, promotion: prom });
        clearSelection();
        renderPieces();
        return;
      }
      if (piece && piece.color === playerColor) {
        selectedSquare = square;
        const sqEl = document.querySelector(`.square[data-square="${square}"]`);
        if (sqEl) sqEl.classList.add('selected');
      }
    }

    function selectSquare(square) {
      clearSelection();
      selectedSquare = square;
      const sqEl = document.querySelector(`.square[data-square="${square}"]`);
      if (sqEl) sqEl.classList.add('selected');

      const active = getActiveGame();
      const moves = active.moves({ square: square, verbose: true });
      moves.forEach(m => {
        const destEl = document.querySelector(`.square[data-square="${m.to}"]`);
        if (destEl) {
          const hint = document.createElement('div');
          hint.className = m.captured ? 'capture-hint' : 'move-hint';
          destEl.appendChild(hint);
        }
      });
    }

    function clearSelection() {
      selectedSquare = null;
      document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected');
        const hint = sq.querySelector('.move-hint, .capture-hint');
        if (hint) hint.remove();
      });
    }

    function commitPlayerMove(move) {
      setEngineArrow(null);
      const prevFen = game.fen();
      const res = game.move(move);
      if (!res) return;

      if (res.captured) Sound.capture();
      else if (res.san === 'O-O' || res.san === 'O-O-O') Sound.castle();
      else if (res.san.includes('+')) Sound.check();
      else Sound.move();

      lastMoveSquares = [move.from, move.to];
      worstPieceSquare = null;
      suggestedSquares = [];
      historyIndex = game.history().length;
      renderPieces();

      // Switch Clock Turn: add increment and transfer clock to bot
      switchClockTurn(playerColor);

      const uciStr = `${move.from}${move.to}${move.promotion || ''}`;
      const time_ms = performance.now() - turnStartTime;
      gameHistoryTracker.push({
        prev_fen: prevFen,
        curr_fen: game.fen(),
        move_san: res.san,
        uci_move: uciStr,
        color: playerColor,
        move_num: Math.floor((game.history().length + (playerColor === 'w' ? 1 : 0)) / 2),
        time_ms: Math.round(time_ms)
      });

      fetchDetailedCoachFeedback(prevFen, game.fen(), res.san, uciStr, Math.round(time_ms));

      if (game.game_over()) {
        handleGameOver();
        return;
      }

      // Dynamic humanized bot delay
      let botDelay = 400;
      if (timeControl.base > 0) {
        const hLen = game.history().length;
        if (hLen <= 4) botDelay = 300 + Math.random() * 250;
        else if (hLen <= 15) botDelay = 600 + Math.random() * 600;
        else botDelay = 500 + Math.random() * 800;
        const botTime = (playerColor === 'w') ? blackTimeMs : whiteTimeMs;
        if (botTime < 10000) botDelay = Math.min(botDelay, 250);
      }
      if (botMoveTimeoutId) clearTimeout(botMoveTimeoutId);
      botMoveTimeoutId = setTimeout(makeStockfishBotMove, botDelay);
    }

    async function fetchDetailedCoachFeedback(prevFen, currFen, moveSan, uciMove, timeMs) {
      try {
        const moveNumber = Math.floor(game.history().length / 2);
        const resp = await fetch(`${API_BASE}/api/coach_feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prev_fen: prevFen,
            curr_fen: currFen,
            user_move_san: moveSan,
            uci_move: uciMove,
            color: playerColor,
            mode: currentMode,
            move_num: moveNumber,
            time_ms: timeMs
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          renderCoachPillars(data, prevFen);
        }
      } catch (err) {
        console.warn("Feedback fetch error:", err);
      }
    }

    function convertPvToSanNotation(startFen, pvArray) {
      if (!pvArray || pvArray.length === 0) return [];
      const temp = new Chess(startFen);
      const sanMoves = [];
      for (let uci of pvArray) {
        const from = uci.substring(0, 2);
        const to = uci.substring(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        const m = temp.move({ from, to, promotion });
        if (!m) break;
        sanMoves.push({ san: m.san, from: m.from, to: m.to });
      }
      return sanMoves;
    }

    function renderCoachPillars(data, startFen) {
      const badge = document.getElementById('moveBadge');
      badge.style.display = 'inline-flex';
      badge.className = 'move-badge';

      const cls = (data.classification || 'Good Move').toLowerCase();
      if (cls.includes('brilliant')) {
        badge.className = 'move-badge badge-brilliant';
        badge.innerHTML = '!! Brilliant';
      } else if (cls.includes('great')) {
        badge.className = 'move-badge badge-great';
        badge.innerHTML = '! Great Move';
      } else if (cls.includes('best')) {
        badge.className = 'move-badge badge-best';
        badge.innerHTML = '⭐ Best Move';
      } else if (cls.includes('excellent')) {
        badge.className = 'move-badge badge-excellent';
        badge.innerHTML = '✓ Excellent';
      } else if (cls.includes('book')) {
        badge.className = 'move-badge badge-book';
        badge.innerHTML = '📖 Book Move';
      } else if (cls.includes('missed')) {
        badge.className = 'move-badge badge-missed';
        badge.innerHTML = '❌ Missed Win';
      } else if (cls.includes('inaccuracy')) {
        badge.className = 'move-badge badge-inacc';
        badge.innerHTML = '?! Inaccuracy';
      } else if (cls.includes('mistake')) {
        badge.className = 'move-badge badge-mistake';
        badge.innerHTML = '? Mistake';
      } else if (cls.includes('blunder')) {
        badge.className = 'move-badge badge-blunder';
        badge.innerHTML = '?? Blunder';
      } else {
        badge.className = 'move-badge badge-good';
        badge.innerHTML = '✓ Good Move';
      }

      document.getElementById('coachPrinciple').innerText = data.principle || "Active Piece Mobilization";
      document.getElementById('coachMechanics').innerText = data.why_it_works || "Controls key squares and maintains piece coordination.";
      document.getElementById('coachRule').innerText = data.rule_of_thumb || "Always ask what your opponent is threatening before moving.";

      const enginePillar = document.getElementById('enginePillar');
      if (data.engine_best) {
        enginePillar.style.display = 'block';

        cachedDemoStartFen = startFen;
        cachedEngineBestUci = data.engine_best;

        const sanPv = convertPvToSanNotation(startFen, data.engine_pv || [data.engine_best]);
        cachedStockfishLine = sanPv.slice(0, 6);

        const notationText = sanPv.length > 0
          ? sanPv.slice(0, 6).map(m => m.san).join('  ➔  ')
          : data.engine_best;

        document.getElementById('coachEngineNote').innerHTML = `
          <strong>Stockfish 19 Recommendation:</strong> <span style="font-family:'JetBrains Mono'; font-weight:700; color:var(--accent-purple); font-size:0.92rem;">${notationText}</span><br>
          <span style="font-size:0.78rem; color:var(--text-muted);">${data.stockfish_note}</span>
        `;

        if (data.engine_best.length >= 4) {
          const from = data.engine_best.substring(0, 2);
          const to = data.engine_best.substring(2, 4);
          setEngineArrow(from, to, 'blue');
        }
      } else {
        enginePillar.style.display = 'none';
        setEngineArrow(null);
      }
    }

    function playStockfishSuggestedLine() {
      if (!cachedDemoStartFen || !cachedStockfishLine || cachedStockfishLine.length === 0) return;

      if (activeDemonstrationInterval) {
        clearInterval(activeDemonstrationInterval);
        activeDemonstrationInterval = null;
      }

      isReviewing = true;
      displayGame = new Chess(cachedDemoStartFen);
      document.getElementById('reviewBanner').classList.add('active');
      document.getElementById('reviewBannerText').innerText = "Stockfish Line Demonstration (Press Enter to exit)";

      let moveIdx = 0;
      activeDemonstrationInterval = setInterval(() => {
        if (moveIdx >= cachedStockfishLine.length) {
          clearInterval(activeDemonstrationInterval);
          activeDemonstrationInterval = null;
          return;
        }

        const moveData = cachedStockfishLine[moveIdx];
        const res = displayGame.move(moveData.san);
        if (res) {
          lastMoveSquares = [res.from, res.to];
          setEngineArrow(res.from, res.to, 'blue');

          if (res.captured) Sound.capture();
          else if (res.san.includes('+')) Sound.check();
          else Sound.move();

          renderPieces();
        }
        moveIdx++;
      }, 650);
    }

    async function makeStockfishBotMove() {
      if (game.game_over()) return;

      try {
        const resp = await fetch(`${API_BASE}/api/bot_move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: game.fen(), elo: currentElo, movetime: 250 })
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.bestmove) {
            const from = data.bestmove.substring(0, 2);
            const to = data.bestmove.substring(2, 4);
            const promotion = data.bestmove.length > 4 ? data.bestmove[4] : undefined;

            const prevFen = game.fen();
            const moveObj = game.move({ from, to, promotion });
            if (moveObj) {
              if (moveObj.captured) Sound.capture();
              else if (moveObj.san === 'O-O' || moveObj.san === 'O-O-O') Sound.castle();
              else if (moveObj.san.includes('+')) Sound.check();
              else Sound.move();

              lastMoveSquares = [from, to];
              historyIndex = game.history().length;
              renderPieces();

              const time_ms = performance.now() - turnStartTime;
              switchClockTurn(playerColor === 'w' ? 'b' : 'w');

              gameHistoryTracker.push({
                prev_fen: prevFen,
                curr_fen: game.fen(),
                move_san: moveObj.san,
                uci_move: `${from}${to}${promotion || ''}`,
                color: playerColor === 'w' ? 'b' : 'w',
                move_num: Math.floor((game.history().length + (playerColor === 'w' ? 0 : 1)) / 2),
                time_ms: Math.round(time_ms)
              });

              if (game.game_over()) {
                handleGameOver();
                return;
              }

              executeNextPremove();
            }
          }
        }
      } catch (err) {
        console.error("Stockfish bot error:", err);
      }
    }

    function executeNextPremove() {
      if (premoveQueue.length === 0) return;
      const nextPremove = premoveQueue.shift();
      const legalMoves = game.moves({ verbose: true });
      const valid = legalMoves.find(m => m.from === nextPremove.from && m.to === nextPremove.to && m.promotion === nextPremove.promotion);
      if (valid) {
        commitPlayerMove(valid);
      } else {
        premoveQueue = [];
        renderPieces();
      }
    }

    // --- NAVIGATION ---
    function navigateHistory(direction) {
      if (isPuzzleModeActive) exitPuzzleMode();

      const activeHistory = (activeTab === 'review' && fullGameReviewData && fullGameReviewData.reviews)
        ? fullGameReviewData.reviews.map(r => r.move_san)
        : game.history();

      if (activeHistory.length === 0) return;

      if (!isReviewing) historyIndex = activeHistory.length;

      if (direction === 'back') {
        if (historyIndex > 0) historyIndex--;
      } else if (direction === 'forward') {
        if (historyIndex < activeHistory.length) historyIndex++;
      }

      if (historyIndex === activeHistory.length && activeTab === 'play') {
        jumpToLivePosition();
        return;
      }

      isReviewing = true;
      displayGame = new Chess();
      for (let i = 0; i < historyIndex; i++) {
        displayGame.move(activeHistory[i]);
      }

      setEngineArrow(null);
      if (historyIndex > 0) {
        const histVerbose = displayGame.history({ verbose: true });
        const lastM = histVerbose[historyIndex - 1];
        lastMoveSquares = [lastM.from, lastM.to];
      } else {
        lastMoveSquares = [];
      }

      Sound.move();
      document.getElementById('reviewBanner').classList.add('active');
      document.getElementById('reviewBannerText').innerText = `Viewing Move ${historyIndex} / ${activeHistory.length} (Press Enter to exit)`;
      renderPieces();

      // If in review mode, update coach & blue arrow & retry box
      if (activeTab === 'review' && fullGameReviewData && fullGameReviewData.reviews) {
        const rev = fullGameReviewData.reviews[historyIndex - 1];
        if (rev) {
          renderCoachPillars(rev.coach, rev.prev_fen);
          document.getElementById('reviewStepDisplay').innerText = `Move ${historyIndex} / ${activeHistory.length} (${rev.move_san})`;
          if (rev.engine_best && rev.engine_best.length >= 4) {
            setEngineArrow(rev.engine_best.substring(0,2), rev.engine_best.substring(2,4), 'blue');
          }

          // Check if retry card should be shown
          const cls = rev.coach.classification.toLowerCase();
          const retryCard = document.getElementById('retryCard');
          if (cls.includes('blunder') || cls.includes('mistake') || cls.includes('missed')) {
            retryCard.style.display = 'flex';
            document.getElementById('retryText').innerText = `⚠️ You played ${rev.move_san} (${rev.coach.classification}). Can you find Stockfish's winning move?`;
            activePuzzleBestUci = rev.engine_best;
            activePuzzleStartFen = rev.prev_fen;
            document.getElementById('puzzleFeedback').style.display = 'none';
          } else {
            retryCard.style.display = 'none';
          }
        }
      }
    }

    function jumpToLivePosition() {
      if (activeDemonstrationInterval) {
        clearInterval(activeDemonstrationInterval);
        activeDemonstrationInterval = null;
      }
      if (isPuzzleModeActive) exitPuzzleMode();

      isReviewing = false;
      displayGame = null;
      historyIndex = game.history().length;
      document.getElementById('reviewBanner').classList.remove('active');
      setEngineArrow(null);

      const histVerbose = game.history({ verbose: true });
      if (histVerbose.length > 0) {
        const lastM = histVerbose[histVerbose.length - 1];
        lastMoveSquares = [lastM.from, lastM.to];
      } else {
        lastMoveSquares = [];
      }
      renderPieces();
    }

    function jumpToSpecificMove(index) {
      if (isPuzzleModeActive) exitPuzzleMode();

      const activeHistory = (activeTab === 'review' && fullGameReviewData && fullGameReviewData.reviews)
        ? fullGameReviewData.reviews.map(r => r.move_san)
        : game.history();

      if (index >= activeHistory.length) {
        jumpToLivePosition();
        return;
      }

      historyIndex = index + 1;
      isReviewing = true;
      displayGame = new Chess();
      for (let i = 0; i < historyIndex; i++) {
        displayGame.move(activeHistory[i]);
      }
      const histVerbose = displayGame.history({ verbose: true });
      if (index >= 0) {
        const lastM = histVerbose[index];
        lastMoveSquares = [lastM.from, lastM.to];
      } else {
        lastMoveSquares = [];
      }

      setEngineArrow(null);
      Sound.move();
      document.getElementById('reviewBanner').classList.add('active');
      document.getElementById('reviewBannerText').innerText = index === -1 ? `Starting Position (Press Enter to exit)` : `Viewing Move ${historyIndex} / ${activeHistory.length} (Press Enter to exit)`;
      renderPieces();

      if (activeTab === 'review' && fullGameReviewData && fullGameReviewData.reviews) {
        if (index === -1) {
          // Clear coach pillars for start position
          renderCoachPillars({ classification: "Start", principle: "Opening principles apply", mechanics: "Control the center", rule_of_thumb: "Develop knights before bishops", engine_best: null, win_prob: 50.0 }, displayGame.fen());
        } else {
          const rev = fullGameReviewData.reviews[index];
          if (rev) {
            renderCoachPillars(rev.coach, rev.prev_fen);
          document.getElementById('reviewStepDisplay').innerText = `Move ${historyIndex} / ${activeHistory.length} (${rev.move_san})`;
          if (rev.engine_best && rev.engine_best.length >= 4) {
            setEngineArrow(rev.engine_best.substring(0,2), rev.engine_best.substring(2,4), 'blue');
          }

          const cls = rev.coach.classification.toLowerCase();
          const retryCard = document.getElementById('retryCard');
          if (cls.includes('blunder') || cls.includes('mistake') || cls.includes('missed')) {
            retryCard.style.display = 'flex';
            document.getElementById('retryText').innerText = `⚠️ You played ${rev.move_san} (${rev.coach.classification}). Can you find Stockfish's winning move?`;
            activePuzzleBestUci = rev.engine_best;
            activePuzzleStartFen = rev.prev_fen;
            document.getElementById('puzzleFeedback').style.display = 'none';
          } else {
            retryCard.style.display = 'none';
          }
        }
        }
      }
    }

    // --- KEYBOARD LISTENERS ---
    window.addEventListener('keydown', (e) => {
      // 0. Promotion Hotkeys (Q, N, R, B, Escape)
      if (pendingPromotion) {
        const k = e.key.toLowerCase();
        if (['q', 'n', 'r', 'b'].includes(k)) {
          e.preventDefault();
          completePromotion(k);
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          hidePromotionHUD();
          return;
        }
      }

      if (activeTab === 'lichess') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentVariationNode && currentVariationNode.parent) {
            jumpToVariationNode(currentVariationNode.parent.id);
          }
          return;
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (currentVariationNode && currentVariationNode.children.length > 0) {
            jumpToVariationNode(currentVariationNode.children[0].id);
          }
          return;
        } else if (e.key === 'Tab') {
          if (currentVariationNode && currentVariationNode.parent && currentVariationNode.parent.children.length > 1) {
            e.preventDefault();
            let siblings = currentVariationNode.parent.children;
            let idx = siblings.findIndex(s => s.id === currentVariationNode.id);
            let nextIdx = (idx + 1) % siblings.length;
            jumpToVariationNode(siblings[nextIdx].id);
          }
          return;
        }
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateHistory('back');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateHistory('forward');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        jumpToLivePosition();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        takebackMove();
      } else if (e.key.toLowerCase() === 'x' && activeTab === 'lichess') {
        e.preventDefault();
        showOpponentThreat();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (premoveQueue.length > 0) {
        premoveQueue = [];
        renderPieces();
      }
    });

    function takebackMove() {
      if (isReviewing) jumpToLivePosition();
      if (botMoveTimeoutId) clearTimeout(botMoveTimeoutId);
      game.undo();
      game.undo();
      premoveQueue = [];
      setEngineArrow(null);
      clearUserArrows();
      Sound.undo();
      lastMoveSquares = [];
      worstPieceSquare = null;
      suggestedSquares = [];
      historyIndex = game.history().length;
      if (gameHistoryTracker.length >= 2) gameHistoryTracker.splice(-2, 2);
      renderPieces();
    }

    function resetGame() {
      if (activeDemonstrationInterval) clearInterval(activeDemonstrationInterval);
      game.reset();
      premoveQueue = [];
      setEngineArrow(null);
      clearUserArrows();
      hidePromotionHUD();
      gameStatus = 'active';
      whiteTimeMs = timeControl.base * 1000;
      blackTimeMs = timeControl.base * 1000;
      isClockRunning = false;
      if (clockIntervalId) clearInterval(clockIntervalId);
      clockIntervalId = null;
      updateClockUI();
      jumpToLivePosition();
      lastMoveSquares = [];
      worstPieceSquare = null;
      suggestedSquares = [];
      gameHistoryTracker = [];
      fullGameReviewData = null;
      initVariationTree();
      document.getElementById('moveBadge').style.display = 'none';
      initBoard();

      if (playerColor === 'b') {
        setTimeout(makeStockfishBotMove, 250);
      }
    }

    // --- LICHESS VERTICAL EVALUATION BAR ---
    async function queryStockfishAnalysis() {
      if (!isLichessEngineOn) return;
      try {
        const active = getActiveGame();
        const resp = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: active.fen(), depth: lichessDepth, multipv: 1 })
        });

        if (resp.ok) {
          const data = await resp.json();
          updateVerticalEvalUI(data);
        }
      } catch (err) {}
    }

    function updateVerticalEvalUI(data) {
      const fillEl = document.getElementById('verticalEvalFill');
      const textEl = document.getElementById('verticalEvalText');

      let evalNum = 0;
      let evalDisplay = "+0.0";
      let whitePercent = 50;

      const active = getActiveGame();
      if (data.is_mate) {
        const m = data.mate_in || (data.score_cp > 0 ? 1 : -1);
        evalDisplay = (m > 0) ? `#${m}` : `-#${Math.abs(m)}`;
        whitePercent = (m > 0) ? 100 : 0;
        textEl.style.color = '#fbbf24';
      } else {
        textEl.style.color = '';
        const turn = active.turn();
        evalNum = (turn === 'w') ? (data.score_cp / 100) : (-data.score_cp / 100);
        evalDisplay = (evalNum > 0 ? '+' : '') + evalNum.toFixed(1);
        whitePercent = Math.max(5, Math.min(95, 50 + (evalNum * 6.5)));
      }

      fillEl.style.height = `${whitePercent}%`;
      textEl.innerText = evalDisplay;
      textEl.classList.toggle('black-favored', whitePercent < 50);
    }

    // --- LICHESS MULTI-PV ANALYSIS ---
    async function queryMultiPvAnalysis() {
      if (!isLichessEngineOn) return;
      try {
        const active = getActiveGame();
        const resp = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: active.fen(), depth: lichessDepth, multipv: lichessMultiPvCount })
        });

        if (resp.ok) {
          const data = await resp.json();
          renderMultiPvLines(data.lines || []);
          updateVerticalEvalUI(data);
        }
      } catch (err) {
        console.error("MultiPV error:", err);
      }
    }

    function renderMultiPvLines(lines) {
      multiPvCache = lines;
      const container = document.getElementById('multipvContainer');
      container.innerHTML = '';

      const active = getActiveGame();
      const turn = active.turn();

      lines.forEach((lineData, idx) => {
        const score = lineData.is_mate
          ? `M${lineData.mate_in}`
          : ((turn === 'w' ? lineData.score_cp : -lineData.score_cp) / 100).toFixed(1);

        const sanMoves = convertPvToSanNotation(active.fen(), lineData.pv || []);
        const moveText = sanMoves.length > 0
          ? `<strong>${sanMoves[0].san}</strong> ${sanMoves.slice(1).map(m => m.san).join(' ')}`
          : (lineData.bestmove || '...');

        const lineEl = document.createElement('div');
        lineEl.className = 'multipv-line';
        lineEl.innerHTML = `
          <div class="multipv-eval">${(score > 0 && !score.startsWith('M') ? '+' : '') + score}</div>
          <div class="multipv-moves">${moveText}</div>
        `;
        lineEl.onclick = () => executePvLine(idx + 1);
        container.appendChild(lineEl);
      });

      if (lines[0] && lines[0].bestmove) {
        const from = lines[0].bestmove.substring(0, 2);
        const to = lines[0].bestmove.substring(2, 4);
        setEngineArrow(from, to, 'blue');
      }
    }

    function executePvLine(idx) {
      const lineData = multiPvCache[idx - 1];
      const active = getActiveGame();
      if (lineData && lineData.pv) {
        if (activeTab === 'lichess') {
          let moves = lineData.pv.split(' ');
          let addedCount = 0;
          for (let m of moves) {
            if (m.length < 4) break;
            let from = m.substring(0, 2);
            let to = m.substring(2, 4);
            let promotion = m.length === 5 ? m[4] : undefined;
            let movesList = active.moves({verbose:true});
            let validMove = movesList.find(x => x.from === from && x.to === to && x.promotion === promotion);
            if (validMove) {
              active.move(validMove);
              addVariationMove(validMove, active);
              addedCount++;
            } else {
              break;
            }
          }
          if (addedCount > 0) {
             lastMoveSquares = [active.history({verbose:true}).slice(-1)[0].from, active.history({verbose:true}).slice(-1)[0].to];
             clearSelection();
             renderPieces();
             queryMultiPvAnalysis();
          }
        } else {
          const sanMoves = convertPvToSanNotation(active.fen(), lineData.pv);
          if (sanMoves.length > 0) {
            cachedDemoStartFen = active.fen();
            cachedStockfishLine = sanMoves.slice(0, 6);
            playStockfishSuggestedLine();
          }
        }
      }
    }

    function toggleLichessEngine() {
      isLichessEngineOn = !isLichessEngineOn;
      const btn = document.getElementById('btnEngineToggle');
      btn.innerText = isLichessEngineOn ? '🟢 ON' : '🔴 OFF';
      btn.className = isLichessEngineOn ? 'btn btn-emerald' : 'btn btn-rose';
      if (isLichessEngineOn) queryMultiPvAnalysis();
    }

    function changeLichessMultiPv(count) {
      lichessMultiPvCount = count;
      document.querySelectorAll('.lichess-engine-bar .selector-btn-group button[id^="mpv-"]').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`mpv-${count}`);
      if (activeBtn) activeBtn.classList.add('active');
      queryMultiPvAnalysis();
    }

    function changeLichessDepth(depth) {
      lichessDepth = depth;
      document.querySelectorAll('.lichess-engine-bar .selector-btn-group button[id^="depth-"]').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`depth-${depth}`);
      if (activeBtn) activeBtn.classList.add('active');
      document.getElementById('lichessEngineSpeed').innerText = `Stockfish 19 NNUE • Depth ${depth}`;
      queryMultiPvAnalysis();
    }

    function snapBackToMainGame() {
      initVariationTree();
      document.getElementById('sandboxVariationText').innerText = "Move any piece freely to explore hypothetical variations.";
      jumpToLivePosition();
      queryMultiPvAnalysis();
    }

    function flipBoardOrientation() {
      isFlipped = !isFlipped;
      initBoard();
    }

    function copyCurrentFen() {
      const fen = getActiveGame().fen();
      navigator.clipboard.writeText(fen).then(() => {
        alert("FEN copied to clipboard:\n" + fen);
      });
    }

    function copyCurrentPgn() {
      const pgn = game.pgn();
      navigator.clipboard.writeText(pgn).then(() => {
        alert("PGN copied to clipboard:\n" + pgn);
      });
    }

    function loadPastedFenOrPgn() {
      const input = document.getElementById('importFenInput').value.trim();
      if (!input) return;

      const temp = new Chess();
      if (temp.load(input)) {
        game = temp;
        gameHistoryTracker = [];
        jumpToLivePosition();
        alert("Custom FEN position loaded successfully!");
      } else if (temp.load_pgn(input)) {
        game = temp;
        populateHistoryTrackerFromChessJs(temp);
        jumpToLivePosition();
        alert("Custom PGN loaded successfully! Click Run Review to analyze.");
      } else {
        alert("Invalid FEN or PGN format. Please check your string.");
      }
    }

    // --- LICHESS SHOW THREAT ---
    async function showOpponentThreat() {
      try {
        const active = getActiveGame();
        const resp = await fetch(`${API_BASE}/api/threat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: active.fen(), depth: 10 })
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.bestmove && data.bestmove.length >= 4) {
            const from = data.bestmove.substring(0, 2);
            const to = data.bestmove.substring(2, 4);
            setEngineArrow(from, to, 'red');

            document.getElementById('coachPrinciple').innerText = "Opponent Threat Detected!";
            document.getElementById('coachMechanics').innerText = `If given a free move, the opponent threatens: ${from.toUpperCase()} ➔ ${to.toUpperCase()}. Neutralize this threat before launching your attack!`;
          }
        }
      } catch (err) {
        console.error("Threat error:", err);
      }
    }

    // --- CHESS.COM GAME REVIEW & REAL GAMES DROPDOWN ---
    async function loadRecentGamesDropdown() {
      if (cachedRecentGames.length > 0) return;
      try {
        const resp = await fetch(`${API_BASE}/api/user_games`);
        if (resp.ok) {
          cachedRecentGames = await resp.json();
          const select = document.getElementById('gameReviewSelect');
          select.innerHTML = '<option value="live">Current Match / Live Sparring</option>';
          cachedRecentGames.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.innerText = `${g.white} vs ${g.black} (${g.white_result || 'Game'}) • ${g.date}`;
            select.appendChild(opt);
          });
        }
      } catch (e) {
        console.warn("Could not load recent games:", e);
      }
    }

    let isReviewRunning = false;

    function handleGameSelectChange(val) {
      fullGameReviewData = null;
      if (val === 'live') {
        populateHistoryTrackerFromChessJs(game, playerColor);
        document.getElementById('topPlayerLabel').innerText = `Stockfish 19 (${actualSparringElo} ELO)`;
        document.getElementById('bottomPlayerLabel').innerText = `hardaf069 (1350 Rapid)`;
        jumpToLivePosition();
        if (game.history().length > 0) {
          runFullGameReview();
        }
        return;
      }
      const selectedGame = cachedRecentGames.find(g => g.id == val);
      if (selectedGame && selectedGame.pgn) {
        const temp = new Chess();
        if (temp.load_pgn(selectedGame.pgn)) {
          game = temp;
          const pColor = (selectedGame.white && selectedGame.white.toLowerCase().includes('hardaf069')) ? 'w' : 'b';
          populateHistoryTrackerFromChessJs(temp, pColor);
          document.getElementById('topPlayerLabel').innerText = `${selectedGame.black} (${selectedGame.black_rating})`;
          document.getElementById('bottomPlayerLabel').innerText = `${selectedGame.white} (${selectedGame.white_rating})`;
          runFullGameReview();
        }
      }
    }

    function populateHistoryTrackerFromChessJs(chessObj, pColor = 'w') {
      gameHistoryTracker = [];
      const tempGame = new Chess();
      const moves = chessObj.history({ verbose: true });
      moves.forEach((m, idx) => {
        const pFen = tempGame.fen();
        tempGame.move(m);
        const promotion = m.promotion ? m.promotion : '';
        gameHistoryTracker.push({
          prev_fen: pFen,
          curr_fen: tempGame.fen(),
          move_san: m.san,
          uci_move: `${m.from}${m.to}${promotion}`,
          color: m.color,
          move_num: Math.floor(idx / 2) + 1
        });
      });
      playerColor = pColor;
    }

    function triggerSelectedGameReview() {
      if (isReviewRunning) return;
      fullGameReviewData = null;
      runFullGameReview();
    }

    async function runFullGameReview() {
      if (isReviewRunning) return;

      const selVal = document.getElementById('gameReviewSelect') ? document.getElementById('gameReviewSelect').value : 'live';
      if (selVal === 'live') {
        populateHistoryTrackerFromChessJs(game, playerColor);
      }

      if (!gameHistoryTracker || gameHistoryTracker.length === 0) {
        if (game.history().length > 0) {
          populateHistoryTrackerFromChessJs(game, playerColor);
        } else {
          document.getElementById('revWhiteAcc').innerText = "--%";
          document.getElementById('revBlackAcc').innerText = "--%";
          document.getElementById('coachSummaryText').innerText = "Play or select a match before running Game Review!";
          return;
        }
      }

      isReviewRunning = true;
      const runBtn = document.getElementById('btnRunReview');
      if (runBtn) {
        runBtn.disabled = true;
        runBtn.innerHTML = '⏳ Analyzing...';
        runBtn.style.opacity = '0.6';
      }

      document.getElementById('revWhiteAcc').innerText = "Analyzing...";
      document.getElementById('revBlackAcc').innerText = "Analyzing...";
      document.getElementById('coachSummaryText').innerText = "Stockfish 19 is evaluating all moves and finding key blunders/tactics...";

      try {
        const resp = await fetch(`${API_BASE}/api/review_game`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positions: gameHistoryTracker,
            player_color: playerColor,
            mode: currentMode
          })
        });

        if (resp.ok) {
          fullGameReviewData = await resp.json();
          renderFullGameReview(fullGameReviewData);
        } else {
          document.getElementById('revWhiteAcc').innerText = "--%";
          document.getElementById('revBlackAcc').innerText = "--%";
          document.getElementById('coachSummaryText').innerText = "Server error while evaluating game. Please ensure backend is running.";
        }
      } catch (err) {
        console.error("Review error:", err);
        document.getElementById('revWhiteAcc').innerText = "--%";
        document.getElementById('revBlackAcc').innerText = "--%";
        document.getElementById('coachSummaryText').innerText = "Network error connecting to analysis engine.";
      } finally {
        isReviewRunning = false;
        if (runBtn) {
          runBtn.disabled = false;
          runBtn.innerHTML = '⚡ Run Review';
          runBtn.style.opacity = '1';
        }
      }
    }

    function renderFullGameReview(data) {
      document.getElementById('revWhiteAcc').innerText = `${data.white_accuracy}%`;
      document.getElementById('revBlackAcc').innerText = `${data.black_accuracy}%`;
      document.getElementById('revWhiteEloBadge').innerText = `Est. ${data.white_elo} ELO`;
      document.getElementById('revBlackEloBadge').innerText = `Est. ${data.black_elo} ELO`;

      document.getElementById('coachSummaryText').innerText = data.coach_summary;
      document.getElementById('keyMomentsCount').innerText = (data.key_moments || []).length;

      // Phase breakdown
      if (data.phases) {
        document.getElementById('phaseOpeningW').innerText = `${data.phases.white.opening}%`;
        document.getElementById('phaseOpeningB').innerText = `${data.phases.black.opening}%`;
        document.getElementById('phaseMiddleW').innerText = `${data.phases.white.middlegame}%`;
        document.getElementById('phaseMiddleB').innerText = `${data.phases.black.middlegame}%`;
        document.getElementById('phaseEndW').innerText = `${data.phases.white.endgame}%`;
        document.getElementById('phaseEndB').innerText = `${data.phases.black.endgame}%`;
      }

      // Classification table counts
      const wc = data.white_counts;
      const bc = data.black_counts;
      document.getElementById('statBrilliantW').innerText = wc.brilliant; document.getElementById('statBrilliantB').innerText = bc.brilliant;
      document.getElementById('statGreatW').innerText = wc.great; document.getElementById('statGreatB').innerText = bc.great;
      document.getElementById('statBestW').innerText = wc.best; document.getElementById('statBestB').innerText = bc.best;
      document.getElementById('statExcellentW').innerText = wc.excellent; document.getElementById('statExcellentB').innerText = bc.excellent;
      document.getElementById('statGoodW').innerText = wc.good; document.getElementById('statGoodB').innerText = bc.good;
      document.getElementById('statBookW').innerText = wc.book; document.getElementById('statBookB').innerText = bc.book;
      document.getElementById('statInaccW').innerText = wc.inaccuracy; document.getElementById('statInaccB').innerText = bc.inaccuracy;
      document.getElementById('statMistakeW').innerText = wc.mistake; document.getElementById('statMistakeB').innerText = bc.mistake;
      document.getElementById('statMissedW').innerText = wc.missed_win; document.getElementById('statMissedB').innerText = bc.missed_win;
      document.getElementById('statBlunderW').innerText = wc.blunder; document.getElementById('statBlunderB').innerText = bc.blunder;

      drawEvalAdvantageGraph(data.reviews || []);

      jumpToSpecificMove(-1);
      if (data.reviews && data.reviews[0]) {
        renderCoachPillars(data.reviews[0].coach, data.reviews[0].prev_fen);
        document.getElementById('reviewStepDisplay').innerText = `Start Position`;
      }
    }

    // --- PIECE ACTIVITY HEATMAP ---
    let heatmapActive = false;
    function togglePieceHeatmap() {
      heatmapActive = !heatmapActive;
      const heatmapCells = document.querySelectorAll('.heatmap-cell');
      if (!heatmapActive) {
        heatmapCells.forEach(el => el.style.opacity = '0');
        return;
      }

      const isRev = (activeTab === 'review' && fullGameReviewData && fullGameReviewData.reviews);
      const activeHistory = isRev ? fullGameReviewData.reviews.map(r => r.move_san) : game.history();
      
      const tempGame = new Chess();
      const occupancy = {};
      const files = ['a','b','c','d','e','f','g','h'];
      for (let r=1; r<=8; r++) {
        for (let f of files) occupancy[f+r] = 0;
      }

      // Tally piece presence over the entire game
      for (const san of activeHistory) {
        tempGame.move(san);
        const board = tempGame.board();
        for (let r = 0; r < 8; r++) {
          for (let f = 0; f < 8; f++) {
            if (board[r][f]) {
              const sq = files[f] + (8 - r);
              occupancy[sq]++;
            }
          }
        }
      }

      let maxOcc = 0;
      for (const sq in occupancy) {
        if (occupancy[sq] > maxOcc) maxOcc = occupancy[sq];
      }

      heatmapCells.forEach(el => {
        const parentSq = el.parentElement.dataset.square;
        if (occupancy[parentSq] && maxOcc > 0) {
          el.style.opacity = (occupancy[parentSq] / maxOcc * 0.85).toFixed(2);
        } else {
          el.style.opacity = '0';
        }
      });
    }

    // --- ADVANTAGE EVALUATION GRAPH (CANVAS) ---
    function drawEvalAdvantageGraph(reviews) {
      const canvas = document.getElementById('evalGraphCanvas');
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const W = rect.width;
      const H = rect.height;
      const centerY = H / 2;

      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(W, centerY);
      ctx.stroke();

      if (reviews.length === 0) return;

      const stepX = W / Math.max(1, reviews.length - 1);

      const points = reviews.map((r, i) => {
        let cp = r.eval || 0;
        if (r.is_mate) {
          cp = (r.mate_in > 0 || r.eval > 0) ? 900 : -900;
        }
        const clampedCp = Math.max(-650, Math.min(650, cp));
        const y = centerY - (clampedCp / 650) * (centerY - 8);
        return { x: i * stepX, y, review: r, index: i, is_mate: r.is_mate };
      });

      // Gradient Fill
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
      grad.addColorStop(0.5, 'rgba(37, 99, 235, 0.05)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.28)');

      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let p of points) ctx.lineTo(p.x, p.y);
      ctx.lineTo(W, centerY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Curve
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Blunder / Mistake / Mate Dots
      for (let p of points) {
        const cls = p.review.coach ? p.review.coach.classification.toLowerCase() : '';
        if (p.is_mate) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cls.includes('blunder') || cls.includes('missed')) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cls.includes('mistake')) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Vertical line for current review position
      if (historyIndex > 0 && historyIndex <= points.length) {
        const curP = points[historyIndex - 1];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(curP.x, 0);
        ctx.lineTo(curP.x, H);
        ctx.stroke();
      }

      canvas.onclick = (e) => {
        const cRect = canvas.getBoundingClientRect();
        const clickX = e.clientX - cRect.left;
        const clickedIdx = Math.min(reviews.length - 1, Math.max(0, Math.round(clickX / stepX)));
        jumpToSpecificMove(clickedIdx);
      };
    }

    // --- INTERACTIVE PUZZLE & RETRY MISTAKE ENGINE ---
    function startRetryPuzzleMode() {
      if (!activePuzzleStartFen || !activePuzzleBestUci) return;

      isPuzzleModeActive = true;
      displayGame = new Chess(activePuzzleStartFen);
      isReviewing = true;
      lastMoveSquares = [];
      setEngineArrow(null);

      const feedback = document.getElementById('puzzleFeedback');
      feedback.style.display = 'none';

      document.getElementById('reviewBanner').classList.add('active');
      document.getElementById('reviewBannerText').innerText = "🧩 Interactive Puzzle Mode: Play your move on the board!";
      renderPieces();
    }

    function commitPuzzleMove(move) {
      if (!isPuzzleModeActive || !displayGame) return;
      const uci = `${move.from}${move.to}${move.promotion || ''}`;
      const isCorrect = (uci === activePuzzleBestUci || uci.substring(0, 4) === activePuzzleBestUci.substring(0, 4));

      const res = displayGame.move(move);
      if (!res) return;

      lastMoveSquares = [res.from, res.to];
      clearSelection();
      renderPieces();

      const feedback = document.getElementById('puzzleFeedback');
      if (isCorrect) {
        Sound.success();
        feedback.className = 'puzzle-feedback-badge success';
        feedback.innerText = '🎉 Brilliant! That is Stockfish\'s winning continuation!';
        feedback.style.display = 'inline-block';
        setEngineArrow(res.from, res.to, 'blue');
      } else {
        Sound.wrong();
        feedback.className = 'puzzle-feedback-badge fail';
        feedback.innerText = '❌ Not quite! That drops the advantage. Try again or click Hint!';
        feedback.style.display = 'inline-block';
        setTimeout(() => {
          displayGame = new Chess(activePuzzleStartFen);
          renderPieces();
        }, 1200);
      }
    }

    function handlePuzzleSquareClick(square) {
      if (!isPuzzleModeActive || !displayGame) return;

      const active = displayGame;
      const piece = active.get(square);
      const turn = active.turn();

      if (selectedSquare) {
        if (selectedSquare === square) {
          clearSelection();
          return;
        }

        const moves = active.moves({ square: selectedSquare, verbose: true });
        const validMove = moves.find(m => m.to === square);

        if (validMove) {
          const attemptedUci = `${validMove.from}${validMove.to}`;
          const isCorrect = (attemptedUci === activePuzzleBestUci || attemptedUci === activePuzzleBestUci.substring(0, 4));

          const res = active.move(validMove);
          if (res) {
            lastMoveSquares = [res.from, res.to];
            clearSelection();
            renderPieces();

            const feedback = document.getElementById('puzzleFeedback');
            if (isCorrect) {
              Sound.success();
              feedback.className = 'puzzle-feedback-badge success';
              feedback.innerText = '🎉 Brilliant! That is Stockfish\'s winning continuation!';
              feedback.style.display = 'inline-block';
              setEngineArrow(res.from, res.to, 'blue');
            } else {
              Sound.wrong();
              feedback.className = 'puzzle-feedback-badge fail';
              feedback.innerText = '❌ Not quite! That drops the advantage. Try again or click Hint!';
              feedback.style.display = 'inline-block';
              setTimeout(() => {
                displayGame = new Chess(activePuzzleStartFen);
                renderPieces();
              }, 1200);
            }
          }
          return;
        } else if (piece && piece.color === turn) {
          selectSquare(square);
          return;
        } else {
          clearSelection();
          return;
        }
      }

      if (piece && piece.color === turn) {
        selectSquare(square);
      }
    }

    function showPuzzleHint() {
      if (!activePuzzleBestUci) return;
      const fromSq = activePuzzleBestUci.substring(0, 2);
      userDrawnHighlights.set(fromSq, 'yellow');
      renderPieces();
      alert(`💡 Hint: Look closely at your piece on ${fromSq.toUpperCase()}!`);
    }

    function revealPuzzleSolution() {
      if (!activePuzzleStartFen || !activePuzzleBestUci) return;
      displayGame = new Chess(activePuzzleStartFen);
      const from = activePuzzleBestUci.substring(0, 2);
      const to = activePuzzleBestUci.substring(2, 4);
      setEngineArrow(from, to, 'blue');

      const m = displayGame.move({ from, to });
      if (m) lastMoveSquares = [from, to];
      renderPieces();

      const feedback = document.getElementById('puzzleFeedback');
      feedback.className = 'puzzle-feedback-badge success';
      feedback.innerText = `👁️ Solution: ${m ? m.san : activePuzzleBestUci} is the engine-approved move!`;
      feedback.style.display = 'inline-block';
    }

    function exitPuzzleMode() {
      isPuzzleModeActive = false;
      activePuzzleBestUci = null;
      activePuzzleStartFen = null;
      document.getElementById('puzzleFeedback').style.display = 'none';
    }

    // --- KEY MOMENTS JUMP ---
    let currentKeyMomentIdx = -1;
    function jumpNextKeyMoment() {
      if (!fullGameReviewData || !fullGameReviewData.key_moments || fullGameReviewData.key_moments.length === 0) {
        alert("No key moments detected in this match!");
        return;
      }
      const km = fullGameReviewData.key_moments;
      currentKeyMomentIdx = (currentKeyMomentIdx + 1) % km.length;
      const targetMoveIdx = km[currentKeyMomentIdx];
      jumpToSpecificMove(targetMoveIdx);
    }

    function askStockfishSuggestion() {
      queryMultiPvAnalysis();
      switchDashboardTab('lichess');
    }

    function highlightWorstPiece() {
      document.querySelectorAll('.square.worst-piece').forEach(sq => sq.classList.remove('worst-piece'));

      let worstPiece = null;
      let lowestMobility = Infinity;

      for (let r = 1; r <= 8; r++) {
        for (let f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
          const sq = f + r;
          const p = game.get(sq);
          if (p && p.color === playerColor && !['k', 'p'].includes(p.type)) {
            const moves = game.moves({ square: sq });
            if (moves.length < lowestMobility) {
              lowestMobility = moves.length;
              worstPiece = { square: sq, type: p.type };
            }
          }
        }
      }

      if (worstPiece) {
        worstPieceSquare = worstPiece.square;
        const sqEl = document.querySelector(`.square[data-square="${worstPiece.square}"]`);
        if (sqEl) sqEl.classList.add('worst-piece');

        document.getElementById('coachPrinciple').innerText = "Piece Activity & Harmonious Redeployment";
        document.getElementById('coachMechanics').innerText = `Your ${worstPiece.type.toUpperCase()} on ${worstPiece.square} has only ${lowestMobility} legal moves. In the middlegame, bring this inactive piece into active central play!`;
        document.getElementById('coachRule').innerText = "A chain is only as strong as its weakest link: improve your worst piece before opening complications.";
      }
    }

    function changeElo(newElo) {
      currentElo = parseInt(newElo);
      document.getElementById('topPlayerLabel').innerText = `Stockfish 19 (${currentElo} ELO)`;
      document.getElementById('engineBadgeText').innerText = `Stockfish 19 (${currentElo} ELO)`;
    }

    function selectTrainingMode(mode) {
      currentMode = mode;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(`mode-${mode}`);
      if (btn) btn.classList.add('active');

      if (mode === 'larsen') {
        playerColor = 'w';
        isFlipped = false;
        document.getElementById('currentOpeningName').innerText = "Nimzo-Larsen Attack (1. b3)";
        document.getElementById('coachPrinciple').innerText = "Hypermodern Central Pressure (1. b3)";
        document.getElementById('coachMechanics').innerText = "Open with 1. b3. Prepare to post your Bishop on b2 to snipe across the long a1-h8 diagonal, putting pressure on e5 and d4 from afar.";
        document.getElementById('coachRule').innerText = "Develop first, strike second. Do not greedily snatch pawns on g7 or e5 until your king is safely castled!";
      } else if (mode === 'sicilian') {
        playerColor = 'b';
        isFlipped = true;
        document.getElementById('currentOpeningName').innerText = "Sicilian Defense (1... c5)";
        document.getElementById('coachPrinciple').innerText = "Asymmetrical Counter-Attack (Sicilian Defense)";
        document.getElementById('coachMechanics').innerText = "Stockfish will play 1. e4. Reply with 1... c5 to fight for control of d4 and prepare to trade your c-pawn for White's center d-pawn.";
        document.getElementById('coachRule').innerText = "In the Sicilian, castle early before move 10. Central lines open quickly and King safety is paramount.";
      } else {
        document.getElementById('currentOpeningName').innerText = "Standard Open Game";
      }

      resetGame();
    }

    function updateMoveListUI() {
      const listEl = document.getElementById('movesList');
      listEl.innerHTML = '';

      const isRev = (activeTab === 'review' && fullGameReviewData && fullGameReviewData.reviews);
      const activeHistory = isRev ? fullGameReviewData.reviews.map(r => r.move_san) : game.history();
      const activeData = isRev ? fullGameReviewData.reviews : gameHistoryTracker;

      for (let i = 0; i < activeHistory.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const wMove = activeHistory[i];
        const bMove = activeHistory[i + 1] || '';
        
        let wTime = '', bTime = '';
        if (activeData[i] && activeData[i].time_ms !== undefined) {
          wTime = ` <span style="font-size:0.65rem; color:#888;">${(activeData[i].time_ms/1000).toFixed(1)}s</span>`;
        }
        if (activeData[i+1] && activeData[i+1].time_ms !== undefined) {
          bTime = ` <span style="font-size:0.65rem; color:#888;">${(activeData[i+1].time_ms/1000).toFixed(1)}s</span>`;
        }

        const numEl = document.createElement('div');
        numEl.className = 'move-num';
        numEl.innerText = `${moveNum}.`;

        const wEl = document.createElement('div');
        wEl.className = 'move-white' + (isReviewing && historyIndex === i + 1 ? ' move-active' : '');
        wEl.innerHTML = wMove + wTime;
        wEl.onclick = () => jumpToSpecificMove(i);

        const bEl = document.createElement('div');
        bEl.className = 'move-black' + (isReviewing && historyIndex === i + 2 ? ' move-active' : '');
        bEl.innerHTML = bMove + bTime;
        if (bMove) {
          bEl.onclick = () => jumpToSpecificMove(i + 1);
        }

        listEl.appendChild(numEl);
        listEl.appendChild(wEl);
        listEl.appendChild(bEl);
      }
      listEl.scrollTop = listEl.scrollHeight;
    }

    function handleGameOver() {
      setEngineArrow(null);
      if (game.in_checkmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        document.getElementById('coachPrinciple').innerText = "Checkmate!";
        document.getElementById('coachMechanics').innerText = `${winner} has delivered checkmate! Review your game now.`;
      } else if (game.in_draw() || gameStatus === 'draw') {
        document.getElementById('coachPrinciple').innerText = "Draw!";
        document.getElementById('coachMechanics').innerText = "Game concluded peacefully.";
      }

      setTimeout(() => switchDashboardTab('review'), 1200);
    }

    initBoard();
    updateClockUI();
    // --- VARIATION TREE LOGIC ---
    function initVariationTree() {
      variationTree = { 
        fen: game.fen(), 
        move: null, 
        san: null, 
        uci: null,
        children: [], 
        parent: null, 
        id: 'root', 
        depth: 0,
        turn: game.turn() === 'w' ? 'b' : 'w'
      };
      currentVariationNode = variationTree;
      variationIdCounter = 0;
      renderVariationTree();
    }

    function addVariationMove(res, activeGame) {
      if (variationTree.fen === null) {
        initVariationTree();
      }
      
      let existingChild = currentVariationNode.children.find(c => c.san === res.san);
      if (existingChild) {
        currentVariationNode = existingChild;
      } else {
        let newNode = {
          fen: activeGame.fen(),
          move: res,
          san: res.san,
          uci: res.from + res.to + (res.promotion ? res.promotion : ''),
          children: [],
          parent: currentVariationNode,
          id: 'var_' + (++variationIdCounter),
          depth: currentVariationNode.depth + 1,
          turn: currentVariationNode.turn === 'w' ? 'b' : 'w'
        };
        currentVariationNode.children.push(newNode);
        currentVariationNode = newNode;
      }
      renderVariationTree();
      updateSandboxBreadcrumb();
    }

    function jumpToVariationNode(nodeId) {
      let targetNode = findVariationNode(variationTree, nodeId);
      if (targetNode) {
        currentVariationNode = targetNode;
        const active = getActiveGame();
        active.load(targetNode.fen);
        lastMoveSquares = targetNode.move ? [targetNode.move.from, targetNode.move.to] : [];
        clearSelection();
        renderPieces();
        renderVariationTree();
        queryMultiPvAnalysis();
        updateSandboxBreadcrumb();
      }
    }

    function findVariationNode(node, id) {
      if (node.id === id) return node;
      for (let c of node.children) {
        let res = findVariationNode(c, id);
        if (res) return res;
      }
      return null;
    }

    function renderVariationTree() {
      const container = document.getElementById('variationTreeContainer');
      if (activeTab !== 'lichess' || variationTree.children.length === 0) {
        container.style.display = 'none';
        return;
      }
      container.style.display = 'block';
      container.innerHTML = '';
      
      let html = '';
      function traverse(node, isMainLine, indentStr) {
        if (node.id !== 'root') {
          let moveNumberStr = '';
          if (node.turn === 'w') {
            let fenParts = node.parent.fen.split(' ');
            moveNumberStr = '<span class="var-move-number">' + fenParts[5] + '.</span>';
          } else if (isMainLine && node.parent.id === 'root') {
             let fenParts = node.parent.fen.split(' ');
             moveNumberStr = '<span class="var-move-number">' + fenParts[5] + '...</span>';
          }
          
          let activeClass = (node.id === currentVariationNode.id) ? 'active' : '';
          
          if (isMainLine) {
            html += `<div class="var-node ${activeClass}" onclick="jumpToVariationNode('${node.id}')">${moveNumberStr}${node.san}</div>`;
          } else {
            html += `<div class="var-line">`;
            html += `<div class="var-node ${activeClass}" onclick="jumpToVariationNode('${node.id}')">${moveNumberStr}${node.san}</div>`;
          }
        }
        
        if (node.children.length > 0) {
          traverse(node.children[0], isMainLine, indentStr);
          for (let i = 1; i < node.children.length; i++) {
             html += `</div><div class="var-line" style="margin-top:4px;">`;
             traverse(node.children[i], false, indentStr + '  ');
          }
        }
        
        if (!isMainLine && node.id !== 'root') {
          html += '</div>';
        }
      }
      
      traverse(variationTree, true, '');
      container.innerHTML = html;
      
      setTimeout(() => {
        let activeEl = container.querySelector('.var-node.active');
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }

    function updateSandboxBreadcrumb() {
      let path = [];
      let curr = currentVariationNode;
      while(curr && curr.id !== 'root') {
        path.unshift(curr.san);
        curr = curr.parent;
      }
      document.getElementById('sandboxVariationText').innerText = path.length > 0 ? "Path: " + path.join(' ') : "Move any piece freely to explore hypothetical variations.";
    }

    window.jumpToVariationNode = jumpToVariationNode;
  