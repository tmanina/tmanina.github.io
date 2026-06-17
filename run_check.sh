cd /home/adminsec/Downloads/tmaninacopy4
pkill -f 'next' 2>/dev/null
sleep 2
echo 'killed old processes'
PORT=3000 npx next dev > next_output.txt 2>&1 &
PID=$!
sleep 15
echo "--- Curl Output ---"
curl -s http://localhost:3000 | head -n 50
echo -e "\n--- Next.js Output (first 50 lines) ---"
head -n 50 next_output.txt
kill $PID 2>/dev/null
