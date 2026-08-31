export const defaultSettings={voiceURI:'',rate:0.95,volume:0.9,style:'Calm',model:'gemini-1.5-flash',creativity:0.55,memory:true,autoSave:true,recording:true,theme:'dark',motion:'system'};
export const createConversation=(model)=>{const now=Date.now();return{id:crypto.randomUUID(),title:'New voice session',createdAt:now,updatedAt:now,durationMs:0,model,turns:[]}};
export const titleFromSpeech=(s)=>s.trim().split(/\s+/).slice(0,6).join(' ')||'Voice session';
export function loadSettings(){return {...defaultSettings,...JSON.parse(localStorage.getItem('veros.settings.v1')||'{}')}}
export function saveSettings(s){localStorage.setItem('veros.settings.v1',JSON.stringify(s))}
export function loadConversations(){return JSON.parse(localStorage.getItem('veros.conversations.v1')||'[]')}
export function saveConversations(c){localStorage.setItem('veros.conversations.v1',JSON.stringify(c))}
