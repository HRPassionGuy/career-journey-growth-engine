import { timingSafeEqual } from "node:crypto";
import { delegateChiefOfStaffWork, chiefOfStaffResponse } from "../lib/chief-of-staff-orchestrator.mjs";

const MAX_BODY_BYTES = 32 * 1024;
function send(response,status,body){response.statusCode=status;response.setHeader("content-type","application/json; charset=utf-8");response.setHeader("cache-control","no-store");response.end(JSON.stringify(body));}
function authorized(request){const token=process.env.CJGE_WEBHOOK_TOKEN;if(!token)return false;const a=Buffer.from(String(request.headers.authorization||""));const b=Buffer.from(`Bearer ${token}`);return a.length===b.length&&timingSafeEqual(a,b);}
async function body(request){if(request.body&&typeof request.body==="object")return request.body;let value="";for await(const chunk of request){value+=chunk;if(Buffer.byteLength(value)>MAX_BODY_BYTES)throw new Error("request_too_large");}return value?JSON.parse(value):{};}

export default async function handler(request,response){
  if(!process.env.CJGE_WEBHOOK_TOKEN)return send(response,503,{error:"worker_not_configured"});
  if(!authorized(request))return send(response,401,{error:"unauthorized"});
  try{
    if(request.method==="POST")return send(response,202,await delegateChiefOfStaffWork(await body(request)));
    if(request.method==="GET"){
      const url=new URL(request.url,"https://cjge.invalid");
      return send(response,200,await chiefOfStaffResponse({parentAssignmentId:url.searchParams.get("parentAssignmentId")}));
    }
    response.setHeader("allow","GET, POST");return send(response,405,{error:"method_not_allowed"});
  }catch(error){
    const bad=error instanceof SyntaxError||error.message==="request_too_large"||/^Chief of Staff/.test(error.message);
    if(!bad)console.error("CJGE Chief of Staff orchestration failure",{name:error.name,message:error.message});
    return send(response,bad?400:500,{error:bad?error.message:"internal_error"});
  }
}
