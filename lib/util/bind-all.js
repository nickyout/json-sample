module.exports = function(ctx) {
	for (var name in ctx) {
		if (typeof ctx[name] === "function") {
			ctx[name] = ctx[name].bind(ctx);
		}
	}
};