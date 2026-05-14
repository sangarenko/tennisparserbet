const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
async function seed(){
  await db.predictor.deleteMany({});
  const recs=[];
  const used=new Set();
  function uname(p,s){for(let t=0;t<20;t++){const n=pick(p)+pick(s)+(t>0?rand(1,9999):"");if(!used.has(n)){used.add(n);return n}}return pick(p)+pick(s)+rand(10000,99999)}
  const specs=["Liga Pro","TT Cup","Setka Cup","Win Cup","Asian Markets","European Leagues","Live Betting","Value Bets"];
  const biosS=["Elite TT analyst with 10+ years of experience. Known for precise predictions in Liga Pro and TT Cup.","Professional TT bettor turned analyst. Deep data-driven approach with ML models.","Former pro table tennis player. Insider knowledge of player form and mental state.","Statistical genius specializing in Asian TT markets. 80%+ accuracy maintained for 2 years.","Full-time TT analyst running a premium VIP channel with the best community track record.","Data scientist applying neural networks to TT predictions. Consistently profitable since 2021.","Legendary predictor known for calling upsets before anyone else. Trusted by thousands worldwide."];
  const biosA=["Experienced bettor focusing on Liga Pro and TT Cup. Solid analytical approach with good track record.","Table tennis enthusiast with strong betting track record. Excellent at spotting value odds in live markets.","Former coach turned analyst. Deep understanding of player psychology and form cycles.","Dedicated TT researcher providing detailed analysis with each prediction. Growing community."];
  const biosB=["Casual TT predictor sharing tips for fun. Mixed results but steadily improving over time.","Part-time analyst focusing mainly on weekend matches and major tournaments.","Learning table tennis betting strategies. Posts picks occasionally when confident."];
  const biosC=["New to TT predictions. Still finding their edge in the market.","Experimental predictor testing various strategies with inconsistent results so far."];

  for(let i=0;i<225;i++){
    const tier=i<25?"S":i<80?"A":i<160?"B":i<205?"C":"D";
    const wr=tier==="S"?rand(78,82):tier==="A"?rand(65,77):tier==="B"?rand(50,64):tier==="C"?rand(30,49):rand(18,29);
    const plat=pick(["telegram","youtube","twitter"]);
    const n=uname(["TT_","Pro","Spin","Rally","Chop","Pong","Paddle","Ace","Quick","Daily","Smart","Random","Lucky","Noob","Scam","Worst","TableTennis","PingPong","TopSpin","Loop","Serve","Backhand","Forehand","Smash"],tier==="S"?["Mind","Elite","Master","Oracle","Pro","Hunter","Genius","King"]:tier==="A"?["Picks","Analytics","Expert","Guru","Wizard","Ninja","Prophet","Scholar","Chief"]:tier==="B"?["Picks","Tips","Bets","Daily","Quick","Smart","Live","Flash","Combo","Safe"]:tier==="C"?["Picks","Guess","Random","Lucky","Blind","Wild","Fun","Test","Try","Shot"]:["Scam","Alert","Fail","Wrong","Trash","Delete","Disaster","Worst","Lose","Bankrupt"]);
    const totalTips=tier==="S"?rand(300,900):tier==="A"?rand(150,600):tier==="B"?rand(50,400):tier==="C"?rand(20,300):rand(30,200);
    recs.push({
      name:n, platform:plat,
      channel:"@"+n.toLowerCase().replace(/[^a-z0-9]/g,"_")+"_"+plat,
      bio:tier==="S"?pick(biosS):tier==="A"?pick(biosA):tier==="B"?pick(biosB):tier==="C"?pick(biosC):"Known for consistently poor predictions. Avoid for bankroll protection.",
      specialization:pick(specs),
      avatarEmoji:tier==="S"?pick(["👑","🏆","💎","🎯","⭐","🧠","🔥"]):tier==="A"?pick(["🟢","🔵","🟡","🟠","🟣","✅","📊"]):tier==="B"?pick(["🟡","🟠","⚪","🔸","⚡","🎲"]):tier==="C"?pick(["🔴","🔻","❌","💀","🐌","🎲"]):pick(["💀","☠","🗑","⛔","🚫"]),
      followers:tier==="S"?rand(5000,50000):tier==="A"?rand(1000,20000):tier==="B"?rand(100,5000):tier==="C"?rand(10,500):rand(0,100),
      totalTips:totalTips,
      correctTips:Math.round(totalTips*(wr/100)),
      winRate:wr,
      avgConfidence:wr/100+rand(-3,8)/100,
      avgOdds:1.2+rand(0,80)/100,
      currentStreak:tier==="S"?rand(3,15):tier==="A"?rand(2,10):tier==="B"?rand(0,5):tier==="C"?rand(-3,2):rand(-10,-1),
      bestStreak:tier==="S"?rand(12,30):tier==="A"?rand(6,20):tier==="B"?rand(3,12):tier==="C"?rand(1,6):rand(1,3),
      monthlyData:"{}",
      tags:tier==="S"?"value,data-driven,aggressive,form-analysis":tier==="A"?"value,trends,form-analysis":tier==="B"?"conservative,gut-feel":"gut-feel",
      verified:tier==="S"||(tier==="A"&&wr>=70),
      qualityScore:tier==="S"?rand(85,100):tier==="A"?rand(65,84):tier==="B"?rand(45,64):tier==="C"?rand(30,44):rand(15,29),
      isActive:wr>=25
    });
  }

  console.log("Inserting "+recs.length+" records...");
  let total=0;
  for(let i=0;i<recs.length;i+=25){
    try{
      const res=await db.predictor.createMany({data:recs.slice(i,i+25)});
      total+=res.count;
      console.log("Batch "+(Math.floor(i/25)+1)+": "+res.count+" inserted");
    }catch(e){
      console.error("Batch "+(Math.floor(i/25)+1)+" error: "+e.message.substring(0,200));
    }
  }

  // Set lastActive for all predictors (can't do with createMany in SQLite)
  console.log("Setting lastActive dates...");
  const all = await db.predictor.findMany();
  for(let i=0;i<all.length;i+=50){
    const batch = all.slice(i,i+50);
    await Promise.all(batch.map(p => 
      db.predictor.update({where:{id:p.id}, data:{lastActive: new Date(Date.now()-rand(0,2592000000))}})
    ));
  }

  // Generate monthly data for top predictors
  console.log("Generating monthly data for top predictors...");
  const topPredictors = await db.predictor.findMany({where:{qualityScore:{gte:50}},orderBy:{qualityScore:'desc'},take:80});
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for(const p of topPredictors){
    const mt=Math.max(3,Math.floor(p.totalTips/12));
    const md={};
    for(let m=0;m<12;m++){
      const tips=mt+rand(-3,8);
      const adj=Math.max(15,Math.min(95,p.winRate+rand(-8,8)));
      md[months[m]]={w:Math.round(tips*adj/100),l:tips-Math.round(tips*adj/100)};
    }
    await db.predictor.update({where:{id:p.id},data:{monthlyData:JSON.stringify(md)}});
  }

  const finalCount=await db.predictor.count();
  console.log("\nDone! Created: "+total+", Total: "+finalCount);
  
  const tiers=await db.predictor.groupBy({by:['platform'],_count:true});
  console.log("By platform:", tiers.map(t=>t.platform+"="+t._count).join(", "));
  
  const sCount=await db.predictor.count({where:{qualityScore:{gte:85}}});
  const aCount=await db.predictor.count({where:{qualityScore:{gte:65,lt:85}}});
  const bCount=await db.predictor.count({where:{qualityScore:{gte:45,lt:65}}});
  const cCount=await db.predictor.count({where:{qualityScore:{gte:30,lt:45}}});
  const dCount=await db.predictor.count({where:{qualityScore:{lt:30}}});
  console.log("Tiers: S="+sCount+" A="+aCount+" B="+bCount+" C="+cCount+" D="+dCount);

  await db.$disconnect();
}
seed().catch(e=>{console.error(e);process.exit(1)});
