# Chess Coach — Cloud Deployment
# Uses python:3.11-slim + Stockfish installed via apt
FROM python:3.11-slim

# Install Stockfish (latest available in Debian repos, sf16)
RUN apt-get update && \
    apt-get install -y --no-install-recommends stockfish && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only what's needed (no node_modules, no Windows engine binary, no __pycache__)
COPY server.py .
COPY index.html .
COPY chess.min.js .
COPY manifest.json .
COPY sw.js .
COPY blunder_vault.json .
COPY 100_rapid_games.json .
COPY saved_games.json .
COPY candidate_moves.json .

# Expose port (Railway injects $PORT at runtime)
EXPOSE 8080

CMD ["python", "-u", "server.py"]
