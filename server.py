import http.server
import socketserver
import subprocess
import threading
import json
import os
import sys
import urllib.parse

PORT = int(os.environ.get('PORT', 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Auto-detect Stockfish binary: env var > Linux path > Windows default
if os.environ.get('STOCKFISH_PATH'):
    STOCKFISH_EXE = os.environ['STOCKFISH_PATH']
elif os.path.exists('/usr/games/stockfish'):
    STOCKFISH_EXE = '/usr/games/stockfish'
elif os.path.exists('/usr/bin/stockfish'):
    STOCKFISH_EXE = '/usr/bin/stockfish'
elif sys.platform.startswith('linux'):
    STOCKFISH_EXE = 'stockfish'  # rely on PATH
else:
    STOCKFISH_EXE = os.path.join(DIRECTORY, 'engine', 'stockfish', 'stockfish-windows-x86-64-universal.exe')

class StockfishManager:
    def __init__(self, exe_path):
        self.exe_path = exe_path
        self.process = None
        self.lock = threading.Lock()
        self.start_engine()

    def start_engine(self):
        if self.process:
            try:
                self.process.kill()
            except Exception:
                pass
        self.process = subprocess.Popen(
            [self.exe_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            bufsize=1,
            errors='ignore'
        )
        self.send('uci')
        while True:
            line = self.process.stdout.readline()
            if not line:
                print("ERROR: Stockfish EOF during UCI init. Restarting...")
                return self.start_engine()
            if 'uciok' in line:
                break
        
        # Configure multi-threading & hash memory for GM speed
        threads = min(8, max(2, (os.cpu_count() or 4) - 1))
        self.send(f'setoption name Threads value {threads}')
        self.send('setoption name Hash value 256')
        self.send('isready')
        while True:
            line = self.process.stdout.readline()
            if not line:
                print("ERROR: Stockfish EOF during init ready check. Restarting...")
                return self.start_engine()
            if 'readyok' in line:
                break
        print(f"Official Stockfish 19 loaded and ready: {threads} threads, 256MB hash.")

    def send(self, cmd):
        try:
            self.process.stdin.write(cmd + '\n')
            self.process.stdin.flush()
        except (BrokenPipeError, OSError):
            print(f"ERROR: Broken pipe sending '{cmd}'. Engine may have crashed.")

    def get_move(self, fen, elo=1500, movetime=400):
        with self.lock:
            elo = max(1320, min(3190, int(elo)))
            self.send('setoption name UCI_LimitStrength value true')
            self.send(f'setoption name UCI_Elo value {elo}')
            self.send('isready')
            while True:
                line = self.process.stdout.readline()
                if not line:
                    print("ERROR: Stockfish EOF in get_move/isready. Restarting...")
                    self.start_engine()
                    return None, None
                if 'readyok' in line:
                    break

            self.send(f'position fen {fen}')
            self.send(f'go movetime {movetime}')

            bestmove = None
            ponder = None
            while True:
                line = self.process.stdout.readline().strip()
                if not line and self.process.poll() is not None:
                    print("ERROR: Stockfish EOF in get_move/bestmove. Restarting...")
                    self.start_engine()
                    return None, None
                if line.startswith('bestmove'):
                    parts = line.split()
                    bestmove = parts[1] if len(parts) > 1 else None
                    if len(parts) > 3 and parts[2] == 'ponder':
                        ponder = parts[3]
                    break
            return bestmove, ponder

    def analyze(self, fen, depth=14, multipv=1):
        with self.lock:
            self.send('setoption name UCI_LimitStrength value false')
            self.send(f'setoption name MultiPV value {multipv}')
            self.send('isready')
            while True:
                line = self.process.stdout.readline()
                if not line:
                    print("ERROR: Stockfish EOF in analyze/isready. Restarting...")
                    self.start_engine()
                    return {'score_cp': 0, 'is_mate': False, 'mate_in': 0, 'bestmove': None, 'pv': [], 'lines': []}
                if 'readyok' in line:
                    break

            self.send(f'position fen {fen}')
            self.send(f'go depth {depth}')

            lines_data = {}
            bestmove = None

            while True:
                line = self.process.stdout.readline().strip()
                if not line and self.process.poll() is not None:
                    print("ERROR: Stockfish EOF in analyze/search. Restarting...")
                    self.start_engine()
                    return {'score_cp': 0, 'is_mate': False, 'mate_in': 0, 'bestmove': None, 'pv': [], 'lines': []}
                if line.startswith('info ') and 'score' in line and 'pv' in line:
                    parts = line.split()
                    mpv_idx = 1
                    if 'multipv' in parts:
                        mpv_idx = int(parts[parts.index('multipv') + 1])

                    score_cp = 0
                    is_mate = False
                    mate_in = 0
                    if 'cp' in parts:
                        score_cp = int(parts[parts.index('cp') + 1])
                    elif 'mate' in parts:
                        is_mate = True
                        mate_in = int(parts[parts.index('mate') + 1])
                        sign = 1 if mate_in > 0 else -1
                        score_cp = sign * max(8000, 10000 - abs(mate_in) * 100)

                    pv = []
                    if 'pv' in parts:
                        idx_pv = parts.index('pv')
                        pv = parts[idx_pv + 1:idx_pv + 7]

                    lines_data[mpv_idx] = {
                        'multipv': mpv_idx,
                        'score_cp': score_cp,
                        'is_mate': is_mate,
                        'mate_in': mate_in,
                        'pv': pv,
                        'bestmove': pv[0] if pv else None
                    }

                if line.startswith('bestmove'):
                    parts = line.split()
                    bestmove = parts[1] if len(parts) > 1 else None
                    break

            # Reset MultiPV back to 1
            if multipv > 1:
                self.send('setoption name MultiPV value 1')

            if bestmove == '(none)' and not lines_data:
                self.send('d')
                is_check = False
                for _ in range(30):
                    d_line = self.process.stdout.readline()
                    if not d_line:
                        print("ERROR: Stockfish EOF in analyze/checkers. Restarting...")
                        self.start_engine()
                        break
                    if 'Checkers:' in d_line:
                        checkers = d_line.split('Checkers:')[1].strip()
                        if checkers and checkers != '-':
                            is_check = True
                        break
                if is_check:
                    primary = {
                        'score_cp': -10000, 'is_mate': True, 'mate_in': 0, 'bestmove': None, 'pv': []
                    }
                else:
                    primary = {
                        'score_cp': 0, 'is_mate': False, 'mate_in': 0, 'bestmove': None, 'pv': []
                    }
            else:
                primary = lines_data.get(1, {
                    'score_cp': 0, 'is_mate': False, 'mate_in': 0, 'bestmove': bestmove, 'pv': []
                })

            return {
                'score_cp': primary['score_cp'],
                'is_mate': primary['is_mate'],
                'mate_in': primary['mate_in'],
                'bestmove': bestmove or primary['bestmove'],
                'pv': primary['pv'],
                'lines': [lines_data[k] for k in sorted(lines_data.keys())]
            }

    def get_threat(self, fen, depth=10):
        # Invert turn in FEN to calculate what opponent would play with a free move
        parts = fen.split()
        if len(parts) >= 2:
            parts[1] = 'b' if parts[1] == 'w' else 'w'
            parts[3] = '-' # clear en passant
            threat_fen = ' '.join(parts)
            return self.analyze(threat_fen, depth=depth, multipv=1)
        return None

engine = StockfishManager(STOCKFISH_EXE)

import math

def calc_win_prob(score_cp, is_mate=False, mate_in=0):
    if is_mate or abs(score_cp) >= 8000:
        if is_mate and mate_in != 0:
            return 100.0 if mate_in > 0 else 0.0
        return 100.0 if score_cp > 0 else 0.0
    try:
        val = 50.0 + 50.0 * (2.0 / (1.0 + math.exp(-0.00368208 * score_cp)) - 1.0)
        return max(0.0, min(100.0, val))
    except OverflowError:
        return 100.0 if score_cp > 0 else 0.0

def calc_move_accuracy(win_loss):
    return max(0.0, min(100.0, 103.1668 * (math.exp(-0.04354 * win_loss)) - 3.1669))

class CoachFeedbackGenerator:
    """Generates rich, pedagogical feedback explaining the principles, mechanics, and rules of thumb."""

    @staticmethod
    def generate(user_move_san, uci_move, prev_fen, curr_fen, move_num, color, mode, eval_diff, pre_eval, post_eval, engine_best, engine_pv, pre_win=None, post_win=None, win_loss=None, time_ms=None):
        if pre_win is None:
            pre_win = calc_win_prob(pre_eval)
        if post_win is None:
            post_win = calc_win_prob(post_eval)
        if win_loss is None:
            win_loss = max(0.0, pre_win - post_win)

        # 1. Opening Book & Repertoire Overrides
        is_book_move = False
        if mode == 'larsen' and move_num <= 1 and user_move_san in ['b3', 'b2b3']:
            is_book_move = True
        elif mode == 'sicilian' and move_num <= 1 and user_move_san in ['c5', 'c7c5']:
            is_book_move = True

        # Grandmaster Scientific Classification via CAPS Win Probability Delta:
        if is_book_move:
            classification = "Book Move"
        elif pre_win >= 85.0 and post_win <= 55.0 and win_loss >= 25.0:
            classification = "Missed Win"
        elif win_loss <= 1.5 and any(p in user_move_san for p in ['Q', 'R', 'B', 'N']) and pre_win < 45.0 and post_win >= 70.0:
            classification = "Brilliant"
        elif win_loss <= 1.5 and pre_win < 52.0 and post_win > pre_win + 3.0:
            classification = "Great Move"
        elif win_loss <= 1.5 or (engine_best and uci_move == engine_best):
            classification = "Best Move"
        elif win_loss <= 4.0:
            classification = "Excellent"
        elif win_loss <= 8.5:
            classification = "Good Move"
        elif win_loss <= 16.0:
            classification = "Inaccuracy"
        elif win_loss <= 28.0:
            classification = "Mistake"
        else:
            classification = "Blunder"

        # Defaults
        principle = "Active Piece Mobilization & Harmony"
        why_it_works = "Coordinates pieces harmoniously toward central influence and solidifies positional control."
        rule_of_thumb = "Every piece should enter the game with a clear purpose and harmonious squares."
        stockfish_note = f"Stockfish confirms this preserves an evaluation of {post_eval/100:+.2f} (Win Prob: {post_win:.1f}%)."

        move_lower = user_move_san.lower()
        matched_specific_motif = False

        # --- A. SPECIFIC OPENING REPERTOIRE (FOR HARDAF069) ---
        if user_move_san in ['b3', 'b2b3']:
            principle = "Hypermodern Flank Control (Nimzo-Larsen Attack)"
            why_it_works = "Instead of occupying the center with pawns right away, 1. b3 prepares your dark-squared Bishop to occupy b2. From the b2 sniper nest, your bishop strikes right through the long a1-h8 diagonal, putting lasting pressure on e5 and d4 from afar while remaining safe behind your pawn front."
            rule_of_thumb = "Control the center with long-range piece power from the flanks before committing your central pawns."
            stockfish_note = "Stockfish evaluates 1. b3 as a completely sound, flexible flank opening with rich asymmetric middlegames."
            matched_specific_motif = True

        elif user_move_san in ['Bb2', 'c1b2']:
            principle = "Long Diagonal Sniper Domination"
            why_it_works = "The Bishop on b2 exerts permanent tactical pressure along the great diagonal. It pins down Black's e5 square, discourages premature central expansion, and prepares to coordinate with your Kingside Knight coming to f3."
            rule_of_thumb = "Your fianchettoed bishop is your tactical pride—never trade it lightly for a passive enemy knight unless it permanently wrecks their pawn shield."
            stockfish_note = "Stockfish emphasizes maintaining the bishop pair and keeping this long diagonal active."
            matched_specific_motif = True

        elif user_move_san in ['c5', 'c7c5']:
            principle = "Asymmetrical Counter-Strike (Sicilian Defense)"
            why_it_works = "By playing 1... c5 against 1. e4, you contest the vital d4 square without entering symmetrical lines. When White eventually pushes d4, you trade your wing c-pawn for White's center d-pawn, creating a 2-vs-1 central pawn majority for Black and opening the c-file for your counterplay."
            rule_of_thumb = "In the Sicilian, whoever controls d4 controls the tempo of the game. Always look to exchange your c-pawn for White's d-pawn."
            stockfish_note = "Stockfish rates 1... c5 as Black's sharpest, most combative, and highest-scoring response to 1. e4."
            matched_specific_motif = True

        elif 'cxd4' in move_lower or 'c5d4' in move_lower:
            principle = "Central Pawn Supremacy & The Half-Open C-File"
            why_it_works = "You achieved the primary strategic goal of the Sicilian: trading your flank c-pawn for White's central d-pawn. Black now possesses two central pawns (d and e) against White's single central pawn (e). You also gain the semi-open c-file to pressure White's queenside with your rooks."
            rule_of_thumb = "Always celebrate trading a wing pawn for a center pawn: it yields enduring endgame advantages."
            stockfish_note = "Stockfish regards this exchange as the central strategic milestone for Black in the open Sicilian."
            matched_specific_motif = True

        elif user_move_san in ['O-O', 'O-O-O']:
            principle = "King Safety & Rook Mobilization"
            why_it_works = "Castling accomplishes two essential goals in a single move: it transports your vulnerable King away from the explosive central files and swings your Rook toward the center files where the decisive battles take place."
            rule_of_thumb = "Castle early before opening central lines. An uncastled King in the center is a disaster waiting to strike."
            stockfish_note = "Stockfish heavily rewards early castling; it connects your rooks and protects your king."
            matched_specific_motif = True

        elif user_move_san in ['Nf3', 'Nc3', 'Nf6', 'Nc6']:
            principle = "Classical Knight Centralization"
            why_it_works = "Knights developed toward the center control up to 8 vital squares and directly contest the e4, d4, e5, and d5 battlegrounds. They also prepare to hop into commanding outposts."
            rule_of_thumb = "Develop knights before bishops: knights have fewer ideal squares, while bishops can pick the perfect diagonal once pawn lines open."
            stockfish_note = "Stockfish awards high marks for clean development tempo."
            matched_specific_motif = True

        elif user_move_san in ['Nh3', 'Na3', 'Nh6', 'Na6']:
            principle = "Flank Concession vs Central Authority"
            why_it_works = "Knights on the edge of the board control only 4 squares instead of 8, cutting their tactical influence in half. Unless routed toward a specific outpost, rim knights remain passive and prone to being trapped."
            rule_of_thumb = "Knights on the rim are dim. Strive to position your knights where they influence central squares."
            stockfish_note = f"Stockfish prefers centralizing with {engine_best}."
            matched_specific_motif = True

        # Early Queen sortie mistake
        elif user_move_san.startswith('Q') and move_num <= 4 and classification in ['Mistake', 'Blunder', 'Inaccuracy']:
            principle = "Premature Queen Exposure"
            why_it_works = "Bringing the Queen out early makes her an easy target. The opponent develops their minor pieces with tempo by attacking your Queen, forcing you to waste valuable moves retreating while they gain a massive lead in development."
            rule_of_thumb = "Do not bring your Queen out early. Develop your minor pieces and secure your King first."
            stockfish_note = f"Stockfish flags this early Queen sortie as a loss of tempo. Recommended was {engine_best}."
            matched_specific_motif = True

        # Greedy early pawn grabbing
        elif ('bxg7' in move_lower or 'bxe5' in move_lower or 'qxb7' in move_lower) and classification in ['Mistake', 'Blunder', 'Inaccuracy']:
            principle = "Greedy Pawn Grabbing & Development Lag"
            why_it_works = "Snatching a distant pawn in the opening while your own King is still stuck in the center and your minor pieces are undeveloped gives the opponent free attacking lines and a dangerous initiative."
            rule_of_thumb = "Never grab poisoned pawns at the expense of basic piece development and King safety."
            stockfish_note = f"Stockfish shows that greedily taking material here costs you valuable tempi. Stockfish preferred {engine_best}."
            matched_specific_motif = True

        # --- B. TACTICAL MOTIFS (IF NOT AN OPENING FORMULA) ---
        if not matched_specific_motif:
            if classification == "Missed Win":
                principle = "Missed Tactical Knockout"
                why_it_works = f"You had a decisive winning advantage (+{pre_eval/100:.1f}), but this move relinquished the win. Stockfish's knockout line was {engine_best}."
                rule_of_thumb = "When you have your opponent on the ropes, calculate forcing checks and captures to close out the game immediately."
                stockfish_note = f"Stockfish preferred {engine_best} ({' '.join(engine_pv[:4]) if engine_pv else ''}) which sealed victory."

            elif classification == "Brilliant":
                principle = "Intuitive Piece Sacrifice"
                why_it_works = f"A brilliant find! You sacrificed material to seize overwhelming attacking momentum or infiltrate the enemy king. Stockfish rates your position at {post_eval/100:+.2f}."
                rule_of_thumb = "Material is temporary, but dynamic initiative and checkmate are permanent."
                stockfish_note = f"Stockfish gives highest honors to this move! Continuation: {' '.join(engine_pv[:4]) if engine_pv else ''}."

            elif classification == "Blunder":
                principle = "Tactical Vulnerability & Blunder Check Failure"
                why_it_works = f"This move leaves a decisive tactical flaw (such as leaving a piece undefended, falling into a pin/fork, or overlooking an opponent's threat). Stockfish's top line is {engine_best}, which punishes the position."
                
                time_warning = ""
                if time_ms is not None and time_ms < 3000:
                    time_warning = f" ⏱️ TIME ALERT: You spent only {time_ms/1000.0:.1f} seconds on this move! Fast blunders are the #1 rating killer. "
                
                rule_of_thumb = f"{time_warning}The 2-Second Blunder Check: Before releasing your piece, ask: 'Did my opponent's last move create a threat?' and 'Is the square I'm moving to safely guarded?'"
                stockfish_note = f"Evaluation swing: {eval_diff/100:.1f} pawns dropped! Stockfish's recommended continuation was {engine_best} ({' '.join(engine_pv[:3]) if engine_pv else ''})."

            elif classification == "Mistake":
                principle = "Strategic Concession & Positional Slip"
                why_it_works = f"While not losing a whole piece, this move relinquishes key positional control (such as handing the opponent an open file, creating backward pawns, or misplacing an active piece). Stockfish preferred {engine_best}."
                rule_of_thumb = "When you don't know what to do in the middlegame, do not push random pawns—find your worst piece and improve it!"
                stockfish_note = f"Stockfish preferred {engine_best}. Line: {' '.join(engine_pv[:4]) if engine_pv else ''}."

            elif classification == "Inaccuracy":
                principle = "Precision & Move Order Nuance"
                why_it_works = f"The strategic idea is reasonable, but Stockfish found a sharper or more forcing move order ({engine_best}) that maintains greater tactical initiative."
                rule_of_thumb = "Tactics flow from a superior position: always look for forcing candidate moves (checks, captures, threats) first."
                stockfish_note = f"Stockfish recommends {engine_best} for tighter control."

            elif classification in ["Best Move", "Book Move"]:
                principle = "Harmonious Piece Coordination"
                why_it_works = "This move maximizes piece synergy, keeps your King safe, and applies purposeful pressure against your opponent's structure."
                rule_of_thumb = "Good players place pieces on good squares; grandmasters make all their pieces work together like a symphony."
                stockfish_note = f"Stockfish ranks this as the engine-approved top choice! ({post_eval/100:+.2f})."
            else:
                principle = "Solid Positional Play"
                why_it_works = "Maintains the structural integrity of your position without allowing counterplay."
                rule_of_thumb = "Consistency and patient piece placement build the foundation for tactical breakthroughs."
                stockfish_note = f"Stockfish evaluates this as a solid continuation ({post_eval/100:+.2f})."

        if '+' in user_move_san:
            principle = f"Forcing Check with Initiative ({principle})"
            rule_of_thumb = "Checks are forcing moves that restrict your opponent's options. Always calculate forcing moves first!"

        return {
            'classification': classification,
            'eval_diff': eval_diff,
            'pre_eval': pre_eval,
            'post_eval': post_eval,
            'engine_best': engine_best,
            'engine_pv': engine_pv,
            'principle': principle,
            'why_it_works': why_it_works,
            'rule_of_thumb': rule_of_thumb,
            'stockfish_note': stockfish_note
        }

def generate_position_plan(curr_fen, move_num, color, classification, post_eval, engine_best, engine_pv, user_move_san):
    """Generate position-specific plan and commentary."""

    # Parse FEN to detect positional themes
    parts = curr_fen.split()
    board_str = parts[0]
    active = parts[1] if len(parts) > 1 else 'w'
    castling = parts[2] if len(parts) > 2 else '-'

    themes = []
    plan_sentences = []
    last_move_sentences = []

    # --- Move commentary ---
    cls = classification.lower()

    if 'blunder' in cls:
        last_move_sentences.append(f"Your move {user_move_san} was a serious error — it handed your opponent a significant advantage.")
        last_move_sentences.append(f"Stockfish's recommendation was {engine_best}: always do a quick blunder check (Checks, Captures, Threats) before moving.")
    elif 'mistake' in cls:
        last_move_sentences.append(f"Your move {user_move_san} was a mistake that conceded positional ground.")
        last_move_sentences.append(f"The engine prefers {engine_best}, which maintains better control. Try to find more active continuations.")
    elif 'inaccuracy' in cls:
        last_move_sentences.append(f"{user_move_san} is playable but slightly imprecise — there was a sharper option available.")
        last_move_sentences.append(f"Stockfish suggests {engine_best} for more dynamic control of the position.")
    elif 'brilliant' in cls:
        last_move_sentences.append(f"Excellent find! {user_move_san} is a brilliant move — it seizes initiative through precise calculation.")
        last_move_sentences.append("This is the kind of move that separates club players from masters: sacrificing material for lasting dynamic compensation.")
    elif 'great' in cls:
        last_move_sentences.append(f"Well played! {user_move_san} is an ambitious and accurate choice that improves your position.")
        last_move_sentences.append("You're finding the engine's preferred ideas — keep trusting your instincts and calculating forcing lines.")
    elif 'best' in cls or 'excellent' in cls:
        last_move_sentences.append(f"{user_move_san} is the engine's top choice — you're on the right track.")
        last_move_sentences.append("Your positional understanding is solid here. Continue applying the same principles.")
    elif 'book' in cls:
        last_move_sentences.append(f"{user_move_san} is a known opening move — you're following established theory.")
        last_move_sentences.append("Focus now on understanding the strategic goals behind this opening rather than just memorizing moves.")
    elif 'missed win' in cls:
        last_move_sentences.append(f"You had a winning position but {user_move_san} let the advantage slip away.")
        last_move_sentences.append(f"The decisive continuation was {engine_best}. When clearly winning, look for forcing sequences: checks, captures, and threats.")
    else:
        last_move_sentences.append(f"{user_move_san} is a solid, reasonable move that maintains your position.")
        last_move_sentences.append("Look to improve your piece activity and control key central squares on your next move.")

    # --- Positional theme detection from FEN ---
    ranks = board_str.split('/')

    # Check castling availability
    can_castle_ks = ('K' in castling if color == 'w' else 'k' in castling)
    can_castle_qs = ('Q' in castling if color == 'w' else 'q' in castling)

    if (can_castle_ks or can_castle_qs) and move_num <= 12:
        themes.append("King safety: castle soon")

    # Check for open files (simplified)
    files = {chr(ord('a') + i): 0 for i in range(8)}
    for rank in ranks:
        col = 0
        for ch in rank:
            if ch.isdigit():
                col += int(ch)
            else:
                if ch in ('P', 'p'):
                    files[chr(ord('a') + col)] = files.get(chr(ord('a') + col), 0) + 1
                col += 1
    open_files = [f for f, cnt in files.items() if cnt == 0]
    if open_files:
        themes.append(f"Open file(s): {', '.join(open_files[:2])} — activate your rooks")

    # Detect imbalance
    if post_eval > 150:
        themes.append(f"You're winning (+{post_eval/100:.1f}) — convert it!")
    elif post_eval < -150:
        themes.append(f"Under pressure ({post_eval/100:.1f}) — find counterplay")
    elif abs(post_eval) <= 30:
        themes.append("Balanced — fight for small advantages")

    # Game phase
    if move_num <= 10:
        phase = 'opening'
    elif move_num <= 25:
        phase = 'middlegame'
    else:
        phase = 'endgame'

    # --- Plan generation by phase ---
    if phase == 'opening':
        plan_sentences.append("Opening priorities: (1) develop all minor pieces to active squares, (2) control the center, (3) castle your king to safety.")
        if can_castle_ks or can_castle_qs:
            plan_sentences.append("You haven't castled yet — make this your top priority before pushing for an attack.")
        else:
            plan_sentences.append("Castle complete! Now connect your rooks by placing them on open or semi-open files.")
    elif phase == 'middlegame':
        if post_eval > 100:
            plan_sentences.append(f"You have a clear advantage ({post_eval/100:+.1f}). Open lines toward the enemy king, create passed pawns, or simplify into a winning endgame.")
            plan_sentences.append("Find your opponent's weakest piece or most vulnerable pawn and target it systematically — don't rush, maintain the tension.")
        elif post_eval < -100:
            plan_sentences.append(f"You're under pressure ({post_eval/100:+.1f}). Eliminate the immediate threats and simplify into a defensible endgame.")
            plan_sentences.append("Avoid making further concessions. Find the move that stabilizes your position and gives your pieces maximum activity.")
        else:
            plan_sentences.append("The position is roughly balanced. Find your worst-placed piece and move it to a better square — this is the foundation of good chess.")
            plan_sentences.append("In balanced positions, create a plan: target a pawn weakness, prepare a pawn break, or maneuver a piece to a dominant outpost.")
    else:  # endgame
        plan_sentences.append("Endgame principle: centralize your king immediately. The king becomes a powerful piece in the endgame.")
        if post_eval > 50:
            plan_sentences.append("You're ahead — push passed pawns, activate rooks behind them, and trade pieces (not pawns) when you have the material advantage.")
        elif post_eval < -50:
            plan_sentences.append("In a worse endgame, create counterplay with passed pawns or set up a fortress. Seek any chance to trade pawns down to a drawn ending.")
        else:
            plan_sentences.append("In an equal endgame: activate your king, centralize rooks, and look to create outside passed pawns to force a win.")

    # Add engine suggestion
    if engine_best:
        plan_sentences.append(f"Candidate move: consider {engine_best} — the engine's top choice for this position.")

    return {
        'last_move_commentary': ' '.join(last_move_sentences),
        'position_plan': ' '.join(plan_sentences),
        'positional_themes': themes[:4],
        'game_phase': phase
    }


class ChessCoachHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def address_string(self):
        return self.client_address[0]

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path).path
        if parsed_path == '/api/user_games':
            games_file = os.path.join(DIRECTORY, '100_rapid_games.json')
            if not os.path.exists(games_file):
                games_file = os.path.join(DIRECTORY, 'saved_games.json')
            if os.path.exists(games_file):
                try:
                    with open(games_file, 'r', encoding='utf-8') as f:
                        raw = json.load(f)
                    game_list = raw if isinstance(raw, list) else raw.get('games', [])
                    summary_list = []
                    for idx, g in enumerate(game_list[:50]):
                        w = g.get('white', {})
                        b = g.get('black', {})
                        summary_list.append({
                            'id': idx,
                            'url': g.get('url', ''),
                            'date': g.get('pgn', '').split('[Date "')[1].split('"]')[0] if '[Date "' in g.get('pgn', '') else 'Recent',
                            'white': w.get('username', 'White'),
                            'white_rating': w.get('rating', 0),
                            'white_result': w.get('result', ''),
                            'black': b.get('username', 'Black'),
                            'black_rating': b.get('rating', 0),
                            'black_result': b.get('result', ''),
                            'eco_url': g.get('eco', ''),
                            'pgn': g.get('pgn', '')
                        })
                    self.send_json(summary_list)
                    return
                except Exception as e:
                    print("Error loading games:", e)
            self.send_json([])
        elif parsed_path == '/api/blunder_vault':
            vault_file = os.path.join(DIRECTORY, 'blunder_vault.json')
            if os.path.exists(vault_file):
                try:
                    with open(vault_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    self.send_json(data)
                    return
                except Exception as e:
                    print("Error loading blunder vault:", e)
            self.send_json([])
        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        try:
            req = json.loads(post_data) if post_data else {}
        except Exception:
            req = {}

        parsed_path = urllib.parse.urlparse(self.path).path

        if parsed_path == '/api/bot_move':
            fen = req.get('fen')
            elo = req.get('elo', 1500)
            movetime = req.get('movetime', 400)
            bestmove, ponder = engine.get_move(fen, elo, movetime)
            actual_elo = max(1320, min(3190, int(elo)))
            resp = {'bestmove': bestmove, 'ponder': ponder, 'elo': actual_elo}
            self.send_json(resp)

        elif parsed_path == '/api/analyze':
            fen = req.get('fen')
            depth = req.get('depth', 14)
            multipv = req.get('multipv', 1)
            analysis = engine.analyze(fen, depth=depth, multipv=multipv)
            self.send_json(analysis)

        elif parsed_path == '/api/threat':
            fen = req.get('fen')
            depth = req.get('depth', 12)
            threat = engine.get_threat(fen, depth=depth)
            self.send_json(threat or {})

        elif parsed_path == '/api/coach_feedback':
            prev_fen = req.get('prev_fen')
            curr_fen = req.get('curr_fen')
            user_move_san = req.get('user_move_san', '')
            uci_move = req.get('uci_move', '')
            color = req.get('color', 'w')
            mode = req.get('mode', 'larsen')
            move_num = req.get('move_num', 1)

            pre_analysis = engine.analyze(prev_fen, depth=14)
            post_analysis = engine.analyze(curr_fen, depth=14)

            pre_eval = pre_analysis['score_cp']
            post_eval = -post_analysis['score_cp']
            eval_diff = pre_eval - post_eval

            pre_win = calc_win_prob(pre_eval, pre_analysis.get('is_mate', False), pre_analysis.get('mate_in', 0))
            post_win = calc_win_prob(post_eval, post_analysis.get('is_mate', False), -post_analysis.get('mate_in', 0) if post_analysis.get('is_mate') else 0)
            win_loss = max(0.0, pre_win - post_win)

            coaching_data = CoachFeedbackGenerator.generate(
                user_move_san=user_move_san,
                uci_move=uci_move,
                prev_fen=prev_fen,
                curr_fen=curr_fen,
                move_num=move_num,
                color=color,
                mode=mode,
                eval_diff=eval_diff,
                pre_eval=pre_eval,
                post_eval=post_eval,
                engine_best=pre_analysis['bestmove'],
                engine_pv=pre_analysis['pv'],
                pre_win=pre_win,
                post_win=post_win,
                win_loss=win_loss,
                time_ms=req.get('time_ms')
            )
            coaching_data['is_mate_pre'] = pre_analysis.get('is_mate', False)
            coaching_data['mate_in_pre'] = pre_analysis.get('mate_in', 0)
            coaching_data['is_mate_post'] = post_analysis.get('is_mate', False)
            coaching_data['mate_in_post'] = post_analysis.get('mate_in', 0)
            coaching_data['pre_win_prob'] = round(pre_win, 1)
            coaching_data['post_win_prob'] = round(post_win, 1)
            coaching_data['win_loss'] = round(win_loss, 1)

            # Generate rich positional plan and move commentary
            plan_data = generate_position_plan(
                curr_fen=curr_fen,
                move_num=move_num,
                color=color,
                classification=coaching_data['classification'],
                post_eval=post_eval,
                engine_best=pre_analysis['bestmove'],
                engine_pv=pre_analysis['pv'],
                user_move_san=user_move_san
            )
            coaching_data.update(plan_data)

            self.send_json(coaching_data)

        elif parsed_path == '/api/review_game':
            positions = req.get('positions', [])
            reviews = []
            player_color = req.get('player_color', 'w')
            mode = req.get('mode', 'larsen')

            fen_cache = {}
            def get_eval(f):
                if f not in fen_cache:
                    fen_cache[f] = engine.analyze(f, depth=10)
                return fen_cache[f]

            white_cpl_list = []
            black_cpl_list = []
            white_counts = {'brilliant': 0, 'great': 0, 'best': 0, 'excellent': 0, 'good': 0, 'book': 0, 'inaccuracy': 0, 'mistake': 0, 'missed_win': 0, 'blunder': 0}
            black_counts = {'brilliant': 0, 'great': 0, 'best': 0, 'excellent': 0, 'good': 0, 'book': 0, 'inaccuracy': 0, 'mistake': 0, 'missed_win': 0, 'blunder': 0}

            phase_stats = {
                'white': {'opening': [], 'middlegame': [], 'endgame': []},
                'black': {'opening': [], 'middlegame': [], 'endgame': []}
            }

            key_moments = []

            for idx, item in enumerate(positions):
                prev_fen = item['prev_fen']
                curr_fen = item['curr_fen']
                move_san = item['move_san']
                uci_move = item['uci_move']
                color = item.get('color', 'w')
                move_num = item.get('move_num', idx // 2 + 1)

                pre = get_eval(prev_fen)
                post = get_eval(curr_fen)

                if move_san.endswith('#'):
                    post = {'score_cp': -10000, 'is_mate': True, 'mate_in': 0, 'bestmove': None, 'pv': []}

                pre_eval = pre['score_cp']
                post_eval = -post['score_cp']
                eval_diff = max(0, pre_eval - post_eval)

                pre_win = calc_win_prob(pre_eval, pre.get('is_mate', False), pre.get('mate_in', 0))
                post_win = calc_win_prob(post_eval, post.get('is_mate', False), -post.get('mate_in', 0) if post.get('is_mate') else 0)
                win_loss = max(0.0, pre_win - post_win)

                time_ms = item.get('time_ms')

                coach_info = CoachFeedbackGenerator.generate(
                    user_move_san=move_san,
                    uci_move=uci_move,
                    prev_fen=prev_fen,
                    curr_fen=curr_fen,
                    move_num=move_num,
                    color=color,
                    mode=mode,
                    eval_diff=eval_diff,
                    pre_eval=pre_eval,
                    post_eval=post_eval,
                    engine_best=pre['bestmove'],
                    engine_pv=pre['pv'],
                    pre_win=pre_win,
                    post_win=post_win,
                    win_loss=win_loss,
                    time_ms=time_ms
                )

                cls_key = coach_info['classification'].lower().replace(' ', '_')
                target_counts = white_counts if color == 'w' else black_counts
                if 'brilliant' in cls_key: target_counts['brilliant'] += 1
                elif 'great' in cls_key: target_counts['great'] += 1
                elif 'best' in cls_key: target_counts['best'] += 1
                elif 'excellent' in cls_key: target_counts['excellent'] += 1
                elif 'book' in cls_key: target_counts['book'] += 1
                elif 'missed' in cls_key: target_counts['missed_win'] += 1
                elif 'inaccuracy' in cls_key: target_counts['inaccuracy'] += 1
                elif 'mistake' in cls_key: target_counts['mistake'] += 1
                elif 'blunder' in cls_key: target_counts['blunder'] += 1
                else: target_counts['good'] += 1

                # Scientific CAPS Move accuracy mapping
                move_acc = calc_move_accuracy(win_loss)
                if color == 'w':
                    white_cpl_list.append(move_acc)
                else:
                    black_cpl_list.append(move_acc)

                phase_name = 'opening' if move_num <= 10 else ('middlegame' if move_num <= 30 else 'endgame')
                phase_stats['white' if color == 'w' else 'black'][phase_name].append(move_acc)

                if any(k in cls_key for k in ['blunder', 'mistake', 'missed', 'brilliant', 'great']):
                    key_moments.append(idx)

                reviews.append({
                    'index': idx,
                    'move_san': move_san,
                    'uci_move': uci_move,
                    'color': color,
                    'move_num': move_num,
                    'is_player': (color == player_color),
                    'prev_fen': prev_fen,
                    'curr_fen': curr_fen,
                    'coach': coach_info,
                    'engine_best': pre['bestmove'],
                    'engine_pv': pre['pv'],
                    'eval': post_eval if color == 'w' else -post_eval,
                    'is_mate': post.get('is_mate', False),
                    'mate_in': post.get('mate_in', 0),
                    'win_prob': round(post_win, 1),
                    'win_loss': round(win_loss, 1),
                    'accuracy': round(move_acc, 1),
                    'time_ms': time_ms
                })

            def calc_acc(lst):
                return round(sum(lst) / max(1, len(lst)), 1) if lst else 75.0

            white_acc = calc_acc(white_cpl_list)
            black_acc = calc_acc(black_cpl_list)

            def calc_elo(acc):
                return int(max(700, min(2500, 750 + ((acc / 100.0) ** 2.2) * 1650)))

            white_elo = calc_elo(white_acc)
            black_elo = calc_elo(black_acc)

            phases_res = {
                'white': {
                    'opening': calc_acc(phase_stats['white']['opening']),
                    'middlegame': calc_acc(phase_stats['white']['middlegame']),
                    'endgame': calc_acc(phase_stats['white']['endgame'])
                },
                'black': {
                    'opening': calc_acc(phase_stats['black']['opening']),
                    'middlegame': calc_acc(phase_stats['black']['middlegame']),
                    'endgame': calc_acc(phase_stats['black']['endgame'])
                }
            }

            p_acc = white_acc if player_color == 'w' else black_acc
            p_counts = white_counts if player_color == 'w' else black_counts
            p_elo = white_elo if player_color == 'w' else black_elo

            summary_text = f"You played with {p_acc}% accuracy, performing like a {p_elo} rated player! "
            if p_counts['blunder'] > 0:
                summary_text += f"You encountered {p_counts['blunder']} blunder(s) and {p_counts['mistake']} mistake(s). Remember the 2-second blunder check before each move: ask 'Did my opponent's last move create a threat?' and 'Is the destination square defended?'. "
            elif p_counts['mistake'] > 0:
                summary_text += f"Very solid match with zero major blunders! Just {p_counts['mistake']} minor mistake(s). "
            else:
                summary_text += "Masterful game! Exceptional precision and piece coordination throughout. "

            self.send_json({
                'white_accuracy': white_acc,
                'black_accuracy': black_acc,
                'white_elo': white_elo,
                'black_elo': black_elo,
                'white_counts': white_counts,
                'black_counts': black_counts,
                'phases': phases_res,
                'coach_summary': summary_text,
                'key_moments': key_moments,
                'reviews': reviews
            })

        elif parsed_path == '/api/opening_explorer':
            fen = req.get('fen', '').split(' ')[0] # just use the piece placement
            # Mock ECO Database based on simple FEN prefix matching or exact match
            # This is a small dict for demonstration
            eco_db = {
                "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR": "King's Pawn Game",
                "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR": "Queen's Pawn Game",
                "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR": "Open Game",
                "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR": "Sicilian Defense",
                "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R": "King's Knight Opening",
                "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R": "Ruy Lopez / Italian Game preparation",
                "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R": "Ruy Lopez",
                "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R": "Italian Game",
                "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R": "Petrov's Defense",
                "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR": "Vienna Game",
                "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R": "Sicilian Defense: Open",
            }
            
            opening_name = "Unknown Opening"
            for db_fen, name in eco_db.items():
                if fen.startswith(db_fen):
                    opening_name = name
                    break

            self.send_json({
                'opening': opening_name,
                'stats': {
                    'win': 30,
                    'draw': 50,
                    'loss': 20
                }
            })

        elif parsed_path == '/api/opponent_prep':
            pgns = req.get('pgns', '')
            # Simple mock parsing for demonstration
            most_frequent_opening = "Sicilian Defense"
            if "e4 e5" in pgns:
                most_frequent_opening = "Open Game"
            elif "d4 Nf6" in pgns:
                most_frequent_opening = "Indian Defense"
            elif "e4 c5" in pgns:
                most_frequent_opening = "Sicilian Defense"
            elif "d4 d5" in pgns:
                most_frequent_opening = "Queen's Gambit"

            # mock response
            self.send_json({
                'most_frequent_opening': most_frequent_opening,
                'average_game_length': 34,
                'tactical_weakness': "Blunders in the endgame (especially rook endgames)"
            })
            
        else:
            self.send_error(404, "Endpoint not found")

    def send_json(self, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run_server():
    with ThreadedHTTPServer(("", PORT), ChessCoachHTTPHandler) as httpd:
        print(f"Server started on http://localhost:{PORT} (multi-threaded)")
        httpd.serve_forever()

if __name__ == '__main__':
    run_server()
