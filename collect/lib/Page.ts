import IRequestContext from "../interfaces/IRequestContext";
import {DomainType} from "./DomainUtils";

const clickElementId = 'next-page';
const clickElementSelector = `#${clickElementId}`;
const waitForElementClass = 'ready';
const waitForElementSelector = `body.${waitForElementClass}`;

export default class Page {
  public static clickElementSelector = clickElementSelector;
  public static waitForElementSelector = waitForElementSelector;

  private scripts: string[] = []
  private headTags: string[] = [];
  private clickToNextPage: boolean = false;
  private ctx: IRequestContext;

  constructor(ctx: IRequestContext) {
    this.ctx = ctx;
  }

  public get html() {
    const nextPageLink = this.ctx.nextPageLink;
    const clickToNextPage = this.clickToNextPage;
    return generateHtml(this.headTags, this.scripts, nextPageLink, clickToNextPage);
  }

  public injectScript(script: string) {
    this.scripts.push(script);
  }

  public injectHeadTag(tag: string) {
    this.headTags.push(tag);
  }

  public addNextPageClick() {
    this.clickToNextPage = true;
  }

  public send() {
    this.ctx.res.writeHead(200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
      'Content-Type': 'text/html',
    });
    this.ctx.res.end(this.html);
  }

  public redirectTo(location: string, domainType: DomainType) {
    this.ctx.res.writeHead(302, {
      location: `${this.ctx.buildUrl(location, domainType)}`,
    });
    this.ctx.res.end();
  }
}

////////////////////////////////////////////////////////////////////

function generateHtml(headTags: string[], scripts: string[], nextPageLink: string, clickToNextPage: boolean) {
  let nextPageTag, finalPageTag;
  if (nextPageLink && clickToNextPage) {
    nextPageTag = `<a href="${nextPageLink}" id="${clickElementId}">Next</a>`;
  } else if (nextPageLink) {
    nextPageTag = `Go to ${nextPageLink}`;
  }
  if (!nextPageLink) {
    finalPageTag = `<div>Plugin Complete</div>`;
  }
  return `
<html>
<head>
    <script>
        window.pageQueue = [];
    </script>
    ${headTags.join('\n')}
</head>
<body onload="pageLoaded()">
<div>
  Loading... <span class="display-inline-when-done" style="display: none;">DONE!</span>
</div>
<div class="display-block-when-done">
  ${nextPageTag || ''}
  ${finalPageTag || ''}
</div>

${scripts.join('\n')}
<style>
.display-inline-when-done { display: none; }
.display-block-when-done { display: none; }
</style>
<script>
  function pageLoaded(){
    document.body.onload = undefined;
    return Promise.all(window.pageQueue)
      .then(() => {
        return window.afterQueueComplete ? window.afterQueueComplete() : null
      })
      .then(() => {
        document.querySelectorAll('.display-inline-when-done').forEach(elem => {
          elem.style.display = 'inline';
        });
        document.querySelectorAll('.display-block-when-done').forEach(elem => {
          elem.style.display = 'block';
        });
        document.body.classList.add('${waitForElementClass}');
        
        window.afterReady ? window.afterReady() : null
      }).catch(err => {
        console.log(err.stack);
      });
  }
</script>
</body>
</html>`;
}
