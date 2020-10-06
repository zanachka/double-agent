// import IRequestContext from '../interfaces/IRequestContext';
// import Layer from '../interfaces/Layer';
// import IFlaggedCheck from '../interfaces/IFlaggedCheck';
//
// export function flaggedCheckFromRequest(ctx: IRequestContext, layer: Layer, category: string) {
//   const request = ctx.requestDetails;
//   const requestIdx = ctx.session.requests.indexOf(request);
//   return {
//     category,
//     layer,
//     resourceType: request.resourceType,
//     originType: request.originType,
//     domainType: request.domainType,
//     secureDomain: request.secureDomain,
//     requestIdx,
//   } as Pick<
//     IFlaggedCheck,
//     | 'category'
//     | 'resourceType'
//     | 'originType'
//     | 'domainType'
//     | 'secureDomain'
//     | 'requestIdx'
//     | 'layer'
//   >;
// }
//
// export function maxBotPctByCategory(ctx: IRequestContext) {
//   const maxPctBotPerCategory: { [category: string]: number } = {};
//   for (const { category, pctBot } of ctx.session.flaggedChecks) {
//     maxPctBotPerCategory[category] = Math.max(maxPctBotPerCategory[category] ?? pctBot, pctBot);
//   }
//   return Object.entries(maxPctBotPerCategory);
// }
