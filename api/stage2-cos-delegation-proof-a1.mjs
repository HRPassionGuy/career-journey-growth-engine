import { delegateChiefOfStaffWork, chiefOfStaffResponse, dispatchChiefOfStaffSynthesis } from "../lib/chief-of-staff-orchestrator.mjs";

const PARENT = "ASN-COS-1789693385500-624db3af";
const DELEGATION_ID = "STAGE2-COS-DELEGATION-PROOF-20260917-A1";

function send(response,status,body){response.statusCode=status;response.setHeader("content-type","application/json; charset=utf-8");response.setHeader("cache-control","no-store");response.end(JSON.stringify(body));}

export default async function handler(request,response){
  if(request.method!=="GET"){response.setHeader("allow","GET");return send(response,405,{error:"method_not_allowed"});}
  try{
    const mode=new URL(request.url,"https://cjge.invalid").searchParams.get("mode")||"dispatch";
    if(mode==="status") return send(response,200,{proof:"stage2-cos-delegation",...(await chiefOfStaffResponse({parentAssignmentId:PARENT}))});
    if(mode==="synthesize") return send(response,202,{proof:"stage2-cos-synthesis",...(await dispatchChiefOfStaffSynthesis({parentAssignmentId:PARENT}))});
    const result=await delegateChiefOfStaffWork({
      parentAssignmentId:PARENT,
      delegationId:DELEGATION_ID,
      delegations:[
        {executive:"vp-revenue",capabilityId:"REV-OPS-001",objective:"Controlled internal-only revenue diagnostic. Using repository and durable CJGE context only, identify the three highest-priority revenue questions the Growth Engine should answer before taking new external action. Do not browse, message, publish, spend, or change external systems."},
        {executive:"analytics",capabilityId:"ANA-OPS-001",objective:"Controlled internal-only analytics diagnostic. Using repository and durable CJGE context only, identify the minimum verified metrics needed to diagnose the current qualified-traffic-to-purchase funnel. Do not browse or access external accounts."}
      ]
    });
    return send(response,202,{proof:"stage2-cos-delegation",...result});
  }catch(error){console.error("Stage 2 delegation proof failed",{name:error.name,message:error.message});return send(response,500,{proof:"stage2-cos-delegation",error:"proof_failed"});}
}
