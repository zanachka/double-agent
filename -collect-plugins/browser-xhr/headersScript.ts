import IRequestContext from "../../interfaces/IRequestContext";

export default function headersScript(ctx: IRequestContext) {
  const domainType = ctx.requestDetails.domainType;
  const prefix = `${ctx.server.protocol}-${domainType}`;
  return `
<script type="text/javascript">
(function() {
  document.cookie = '${prefix}-JsCookies=0';
  const cookies = document.cookie;
  const promise = fetch("${ctx.buildUrl('/fetchSamesite.json', DomainType.MainDomain)}", {
    mode: 'cors'
  });
  window.pageQueue.push(promise);
})();
</script>`;
}
