const FormulaEngine=(()=>{
const cache=new Map();
function parse(f){if(cache.has(f))return cache.get(f);let i=0;const t=f.slice(1).replace(/\$/g,'').match(/(?:[A-Za-z_][A-Za-z_0-9]*!)?[A-Z]+\d+|\d*\.?\d+(?:[eE][+-]?\d+)?|[A-Za-z_]+|<>|>=|<=|[+*/^(),%<>=-]/g)||[];if(t.join('')!==f.slice(1).replace(/[$\s]/g,''))throw Error('Unsupported source formula');
function atom(){let x=t[i++],n;if(x==='-')return ['neg',atom()];if(x==='+')return atom();if(x==='('){n=expr(0);if(t[i++]!==')')throw Error('Formula parentheses');}else if(/^\d|^\./.test(x))n=['num',+x];else if(t[i]==='('){i++;let a=[];if(t[i]!==')'){do{a.push(expr(0));if(t[i]!==',')break;i++;}while(true);}if(t[i++]!==')')throw Error('Formula arguments');n=[x,...a];}else n=['ref',x];if(t[i]==='%'){i++;n=['/',n,['num',100]];}return n;}
const p={'=':1,'<>':1,'>':1,'<':1,'>=':1,'<=':1,'+':2,'-':2,'*':3,'/':3,'^':4};function expr(min){let n=atom();while(p[t[i]]>=min){let op=t[i++];n=[op,n,expr(p[op]+1)];}return n;}const n=expr(0);if(i!==t.length)throw Error('Unsupported formula');cache.set(f,n);return n;}
function calculate(sheet,cell,overrides={},leaves=new Set(),missing=new Set(),stack=new Set()){
const key=sheet+'!'+cell,v=Object.hasOwn(overrides,key)?overrides[key]:DATA.cells[sheet]?.[cell];
if(typeof v==='string'&&v.startsWith('=')){if(stack.has(key))throw Error('Circular source reference');stack.add(key);let result=run(parse(v));stack.delete(key);if(!Number.isFinite(result))throw Error('Invalid source calculation');return result;}
leaves.add(key);if(v===undefined||v===null||v===''){missing.add(key);return 0;}if(typeof v==='number'||typeof v==='boolean')return +v;throw Error('Source reference points to text: '+key);
function run(n){let op=n[0];if(op==='num')return n[1];if(op==='ref'){const a=n[1].split('!');return calculate(a.length>1?a[0]:sheet,a.at(-1),overrides,leaves,missing,stack);}if(op==='IF')return run(n[1])?run(n[2]):run(n[3]);if(op==='MAX')return Math.max(...n.slice(1).map(run));if(op==='neg')return -run(n[1]);let a=run(n[1]),b=run(n[2]);switch(op){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':return a/b;case '^':return a**b;case '=':return +(a===b);case '<>':return +(a!==b);case '>':return +(a>b);case '<':return +(a<b);case '>=':return +(a>=b);case '<=':return +(a<=b);default:throw Error('Unsupported source function');}}
}
return {calculate,parse};})();
