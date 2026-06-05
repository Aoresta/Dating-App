export const WIDGET_REGISTRY=[
  {id:'days_together',label:'Days Together',description:'Counts every day of your journey',icon:'📅',size:'large',defaultEnabled:true},
  {id:'notes_preview',label:'Love Notes',description:'Latest note from your partner',icon:'💌',size:'large',defaultEnabled:true},
  {id:'mood',label:'Mood',description:'Your mood and partner mood side by side',icon:'😊',size:'half',defaultEnabled:true},
  {id:'memories_strip',label:'Memories',description:'Latest memory with photo',icon:'📸',size:'large',defaultEnabled:true},
  {id:'anniversary',label:'Anniversary Countdown',description:'Days until next anniversary',icon:'🎉',size:'half',defaultEnabled:true},
  {id:'doodle_preview',label:'Latest Doodle',description:'Last doodle you or your partner saved',icon:'🎨',size:'half',defaultEnabled:false},
  {id:'quiz_card',label:'Daily Question',description:'A new couple question every day',icon:'💬',size:'large',defaultEnabled:false},
  {id:'shared_image',label:'Photo Moment',description:'Latest shared photo from your partner',icon:'🖼️',size:'large',defaultEnabled:false},
  {id:'love_meter',label:'Love Meter',description:'Animated love percentage based on streak',icon:'💗',size:'half',defaultEnabled:true},
  {id:'partner_status',label:'Partner Status',description:'Online status and current mood',icon:'💑',size:'half',defaultEnabled:true}
]
export const DEFAULT_WIDGETS=WIDGET_REGISTRY.filter(w=>w.defaultEnabled).map(w=>w.id)
