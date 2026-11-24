import json, subprocess
LEAD=0.3; DUR=46.95
seg=[s['start']+LEAD for s in json.load(open('segments.json'))]
words=[{**w,'start':w['start']+LEAD} for w in json.load(open('words.json'))]
def at(i,w):
    nxt=seg[i+1] if i+1<len(seg) else 99
    for x in words:
        if seg[i]-0.01<=x['start']<nxt and x['text'].lower().startswith(w.lower()): return x['start']
    return seg[i]
A='/home/claude/work/proj/audio/audio/'
POP,ERR,CLICK,DROP,SW,SW2,COIN,BELL=(A+'rubberduck-water-40/bubble_01.ogg',A+'kenney-interface/error_002.ogg',A+'kenney-interface/click_002.ogg',A+'kenney-interface/drop_002.ogg',A+'artisticdude-swishes/swish-1.wav',A+'artisticdude-swishes/swish-10.wav',A+'kenney-rpg/handleCoins.ogg',A+'kenney-impact/impactBell_heavy_001.ogg')
sfx=[(ERR,0.5,.25),(POP,at(0,"It's"),.3),(COIN,seg[1]+0.4,.45),(COIN,seg[1]+1.3,.35),
     (POP,seg[2]+0.4,.3),(POP,seg[3]+0.4,.3),(POP,seg[4]+0.4,.3),(BELL,seg[4]+1.2,.2),
     (CLICK,at(6,'Your'),.4),(CLICK,at(6,'Your')+0.5,.4),(CLICK,at(6,'Your')+1.0,.4),
     (ERR,seg[7]+0.4,.3),(POP,at(7,'curve'),.3),(DROP,at(8,'nothing'),.5),
     (ERR,at(9,'one')+0.3,.25),(CLICK,at(9,'fifteen')+0.3,.5),(SW2,seg[9]+4.6,.25)]
sfx+=[(SW,t-0.15,.16) for t in (seg[1],seg[2],seg[5],seg[8],seg[9])]
inp=['-i','picture.mp4','-i','voice.wav','-stream_loop','-1','-i',A+'music/bgm-investigations.mp3']
f=[f'[1:a]aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=150:makeup=4dB,adelay={int(LEAD*1000)}:all=1,apad=whole_dur={DUR},asplit=2[vo][vk]',
   f'[2:a]aresample=48000,atrim=0:{DUR},volume=0.06,afade=t=in:d=0.6,afade=t=out:st={DUR-1.6}:d=1.6[m0]',
   '[m0][vk]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[mu]']
mx=['[vo]','[mu]']; idx=3
for p,t,g in sfx:
    inp+=['-i',p]; f.append(f'[{idx}:a]aresample=48000,volume={g*0.45:.3f},adelay={int(t*1000)}:all=1[s{idx}]'); mx.append(f'[s{idx}]'); idx+=1
f.append(f"{''.join(mx)}amix=inputs={len(mx)}:normalize=0,atrim=0:{DUR},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]")
subprocess.run(['ffmpeg','-v','error','-y',*inp,'-filter_complex',';'.join(f),'-map','0:v','-map','[aout]','-map_metadata','-1','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest','final.mp4'],check=True)
print('ok')
