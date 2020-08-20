import IRequestContext from "../../interfaces/IRequestContext";

export default function cookiesScript(ctx: IRequestContext) {
  const domainType = ctx.requestDetails.domainType;
  const prefix = `${ctx.server.protocol}-${domainType}`;
  return `
<script type="text/javascript">
(function() {
  document.cookie = '${prefix}-JsCookies=0';
  const cookies = document.cookie;
  const promise = fetch("${ctx.buildUrl('/saveFromJs')}", {
    method: 'POST',
    body: JSON.stringify({
      cookies,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  window.pageQueue.push(promise);
})();
</script>`;
}
