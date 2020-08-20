import fs from "fs";
import IRequestContext from "@double-agent/collect/interfaces/IRequestContext";

if (requestUrl.pathname === '/axios.js') {
  sendAxios(ctx);
} else if (requestUrl.pathname === '/axios.min.map') {
  sendAxiosMap(ctx);
}

const axios = fs.readFileSync(require.resolve('axios/dist/axios.min.js'));
function sendAxios(ctx: IRequestContext) {
  ctx.res.writeHead(200, {
    'Content-Type': 'application/javascript',
  });
  ctx.res.end(axios);
}

const axiosMap = fs.readFileSync(require.resolve('axios/dist/axios.min.map'));
function sendAxiosMap(ctx: IRequestContext) {
  ctx.res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
  });
  ctx.res.end(axiosMap);
}


// <script src="${ctx.trackUrl('axios.js', DomainType.MainDomain)}"></script>

// <script>
//     function ws(wsUrl) {
//       return new Promise(resolve => {
//         const ws = new WebSocket(wsUrl);
//         ws.onerror = function(err) {
//           console.log('WebSocket error', err);
//           resolve();
//         };
//         ws.onopen = function() {
//           const message = JSON.stringify({ host: location.host, sessionId: '${sessionId}'});
//           ws.send(message, {
//             compress:true, binary:false, fin: false, mask: true
//           }, function(){});
//           resolve();
//         };
//         ws.onmessage = function(message) {
//           console.log('Websocket message received %s from %s', message.data, message.origin)
//         }
//       });
//     }
// window.pageQueue.push(
//     ws('${ctx.trackUrl('', DomainType.MainDomain, 'ws')}'),
// ws('${ctx.trackUrl('', DomainType.SubDomain, 'ws')}'),
// ws('${ctx.trackUrl('', DomainType.CrossDomain, 'ws')}')
// );
// </script>
