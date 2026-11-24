import json, subprocess
LEAD=0.4; DUR=348.73
seg=[s['start']+LEAD for s in json.load(open('segments.json'))]
A='/home/claude/work/proj/audio/audio/'
POP,SW,CLICK=A+'rubberduck-water-40/bubble_01.ogg',A+'artisticdude-swishes/swish-1.wav',A+'kenney-interface/click_002.ogg'
ch=[4,11,17,24,29,35,42,51,56,61]
sfx=[(SW,seg[i]-0.2,.18) for i in ch]+[(POP,seg[i]+0.3,.22) for i in ch]
inp=['-i','picture.mp4','-i','voice.wav','-stream_loop','-1','-i',A+'music/bgm-decisions.mp3']
f=[f'[1:a]aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=150:makeup=4dB,adelay={int(LEAD*1000)}:all=1,apad=whole_dur={DUR},asplit=2[vo][vk]',
   f'[2:a]aresample=48000,atrim=0:{DUR},volume=0.05,afade=t=in:d=1:st=0,afade=t=out:st={DUR-3}:d=3[m0]',
   '[m0][vk]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[mu]']
mx=['[vo]','[mu]']; idx=3
for p,t,g in sfx:
    inp+=['-i',p]; f.append(f'[{idx}:a]aresample=48000,volume={g*0.45:.3f},adelay={int(max(t,0)*1000)}:all=1[s{idx}]'); mx.append(f'[s{idx}]'); idx+=1
f.append(f"{''.join(mx)}amix=inputs={len(mx)}:normalize=0,atrim=0:{DUR},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]")
subprocess.run(['ffmpeg','-v','error','-y',*inp,'-filter_complex',';'.join(f),'-map','0:v','-map','[aout]','-map_metadata','-1','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest','final.mp4'],check=True); print('ok')
