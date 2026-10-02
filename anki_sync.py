import json
import urllib.request
import urllib.error

def invoke(action, **params):
    requestJson = json.dumps({'action': action, 'params': params, 'version': 6}).encode('utf-8')
    try:
        req = urllib.request.Request('http://localhost:8765', requestJson)
        with urllib.request.urlopen(req) as response:
            responseJson = json.loads(response.read().decode('utf-8'))
            
        if len(responseJson) != 2:
            raise Exception('response has an unexpected number of fields')
        if 'error' not in responseJson:
            raise Exception('response is missing required error field')
        if 'result' not in responseJson:
            raise Exception('response is missing required result field')
        if responseJson['error'] is not None:
            raise Exception(responseJson['error'])
        return responseJson['result']
    except urllib.error.URLError as e:
        print(f"Error connecting to AnkiConnect: {e}")
        return None
    except Exception as e:
        print(f"AnkiConnect invocation error: {e}")
        return None

def main():
    try:
        print("Fetching blunders from http://localhost:8080/api/blunder_vault...")
        req = urllib.request.urlopen("http://localhost:8080/api/blunder_vault")
        blunders = json.loads(req.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching blunders: {e}")
        print("Using dummy data for testing since server might not be running.")
        blunders = [
            {
                "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                "opponent": "GM_Hikaru",
                "best_move_uci": "e2e4",
                "coach": {"rule_of_thumb": "Always control the center early."}
            },
            {
                "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                "opponent": "MagnusCarlsen",
                "best_move_uci": "f1b5",
                "coach": {"rule_of_thumb": "Develop pieces to active squares."}
            }
        ]

    print(f"Fetched {len(blunders)} blunders.")

    deck_name = "Chess Coach Blunders"
    print(f"Creating deck '{deck_name}'...")
    res = invoke('createDeck', deck=deck_name)
    if res is None:
        print("AnkiConnect is likely not running. Exiting gracefully.")
        return

    notes = []
    for blunder in blunders:
        fen = blunder.get("fen", "")
        opp_name = blunder.get("opponent", "Unknown")
        best_move = blunder.get("best_move_uci", "")
        rule = blunder.get("coach", {}).get("rule_of_thumb", "")
        
        front_html = f"<div>FEN: {fen}</div><br><div>Opponent: {opp_name} - Find the GM move!</div>"
        back_html = f"<div>Move: <b>{best_move}</b></div><br><div><i>{rule}</i></div>"
        
        note = {
            "deckName": deck_name,
            "modelName": "Basic",
            "fields": {
                "Front": front_html,
                "Back": back_html
            },
            "options": {
                "allowDuplicate": False,
                "duplicateScope": "deck"
            },
            "tags": ["chess_blunder"]
        }
        notes.append(note)
    
    print(f"Adding {len(notes)} notes to Anki...")
    added_ids = invoke('addNotes', notes=notes)
    
    if added_ids is None:
        print("Failed to add notes.")
        return
        
    valid_ids = [nid for nid in added_ids if nid is not None]
    print(f"Successfully added {len(valid_ids)} notes.")
    
    # CRITICAL USER RULE: Query sample to verify Front and Back
    if valid_ids:
        sample_size = min(3, len(valid_ids))
        sample_ids = valid_ids[:sample_size]
        print(f"Querying sample notes {sample_ids} to verify fields...")
        
        notes_info = invoke('notesInfo', notes=sample_ids)
        if notes_info:
            for info in notes_info:
                print(f"\n--- Note ID: {info['noteId']} ---")
                print("FRONT FIELD:", info['fields'].get('Front', {}).get('value'))
                print("BACK FIELD:", info['fields'].get('Back', {}).get('value'))
        else:
            print("Failed to retrieve sample notes info.")

if __name__ == '__main__':
    main()
