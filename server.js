require('dotenv').config();
const express=require('express'),path=require('path'),app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.get('/',(q,r)=>r.sendFile(path.join(__dirname,'public','index.html')));
app.get('/admin',(q,r)=>r.sendFile(path.join(__dirname,'public','admin.html')));
app.listen(process.env.PORT||3000,()=>console.log('🎬 EditKori running'));
