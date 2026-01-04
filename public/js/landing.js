// Snow canvas (lightweight, looks premium)
const canvas = document.getElementById("snow");
const ctx = canvas.getContext("2d", { alpha:true });

let w=0,h=0,flakes=[];
function resize(){
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  flakes = Array.from({length: Math.floor(Math.min(140, w/10))}, () => ({
    x: Math.random()*w,
    y: Math.random()*h,
    r: 0.6 + Math.random()*1.8,
    s: 0.3 + Math.random()*1.2,
    d: Math.random()*Math.PI*2
  }));
}
window.addEventListener("resize", resize);
resize();

function tick(){
  ctx.clearRect(0,0,w,h);
  ctx.globalAlpha = 0.9;
  for (const f of flakes){
    f.d += 0.01;
    f.y += f.s;
    f.x += Math.sin(f.d)*0.6;
    if (f.y > h+10){ f.y = -10; f.x = Math.random()*w; }
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
  }
  requestAnimationFrame(tick);
}
tick();

// Mouse parallax for mock
const mock = document.querySelector(".mock");
window.addEventListener("mousemove", (e)=>{
  const x = (e.clientX / window.innerWidth - 0.5) * 10;
  const y = (e.clientY / window.innerHeight - 0.5) * 10;
  if (mock) mock.style.transform = `translate(${x}px, ${y}px)`;
});
