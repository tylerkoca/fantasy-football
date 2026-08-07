/*
 * Stat line -> fantasy points. Mirror of scoring.py.
 *
 * The viewer recomputes every projection through this whenever a scoring setting
 * changes, which is what makes flipping reception value 1.0 -> 0.5 instantly reorder
 * the rankings board.
 *
 * TWO RULES FOR EDITING THIS FILE
 *
 * 1. Keep it in lockstep with scoring.py. Two implementations of the same arithmetic
 *    always drift; parity.py asserts both against a shared fixture and will fail loudly
 *    when they do. Edit both files together.
 *
 * 2. Stay in ES3. The parity harness runs this under Windows Script Host, whose
 *    JScript engine has no JSON, no Object.keys, no Array.forEach, and no String.trim.
 *    That is a deliberate trade: an automated cross-language parity test with zero
 *    installed dependencies is worth more than modern syntax in 150 lines of
 *    arithmetic, and ES3 runs in every browser that will ever open the viewer.
 *
 * Determinism: keys are iterated in SORTED order here and in Python. Floating point
 * addition is not associative, so summing in a different order yields answers that
 * differ in the final bits and exact parity becomes impossible.
 */

var Scoring = (function () {
    "use strict";

    function sortedKeys(obj) {
        var keys = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                keys.push(key);
            }
        }
        keys.sort();
        return keys;
    }

    /* Stats no source can supply; mirrors contract.UNPROJECTABLE. */
    var UNPROJECTABLE = ["pass_td_50", "rec_td_50", "rush_td_50"];

    function isUnprojectable(stat) {
        for (var i = 0; i < UNPROJECTABLE.length; i++) {
            if (UNPROJECTABLE[i] === stat) { return true; }
        }
        return false;
    }

    /*
     * Rules depending on a stat nothing can project. The viewer badges affected
     * players rather than letting the rule contribute a silent zero, which would
     * understate them with no indication the tool is wrong.
     */
    function unprojectableRules(config) {
        var found = [];
        var perStat = config.per_stat || {};
        var keys = sortedKeys(perStat);
        for (var i = 0; i < keys.length; i++) {
            if (isUnprojectable(keys[i]) && perStat[keys[i]]) {
                found.push({ kind: "per_stat", stat: keys[i], points: perStat[keys[i]] });
            }
        }
        var bonuses = config.bonuses || [];
        for (var j = 0; j < bonuses.length; j++) {
            if (isUnprojectable(bonuses[j].stat)) {
                found.push({ kind: "bonus", stat: bonuses[j].stat, id: bonuses[j].id });
            }
        }
        return found;
    }

    /*
     * Points from the points-allowed ladder, or null when this is not a DST line.
     * Absence of pts_allowed is what distinguishes a team defense from a player.
     */
    function dstTierPoints(stats, config) {
        var tiers = config.dst_points_allowed;
        if (!tiers || !tiers.length) { return null; }
        var hasAllowed = Object.prototype.hasOwnProperty.call(stats, "pts_allowed");
        if (!hasAllowed) { return null; }
        var allowed = stats.pts_allowed;
        for (var i = 0; i < tiers.length; i++) {
            if (tiers[i].max === null || allowed <= tiers[i].max) {
                return tiers[i].points;
            }
        }
        return tiers[tiers.length - 1].points;
    }

    function scoreDetail(stats, config) {
        var perStat = config.per_stat || {};
        var components = {};
        var total = 0.0;

        var keys = sortedKeys(perStat);
        for (var i = 0; i < keys.length; i++) {
            var stat = keys[i];
            var value = stats[stat];
            if (!value) { continue; }
            var points = value * perStat[stat];
            if (points) {
                components[stat] = points;
                total += points;
            }
        }

        var bonusTotal = 0.0;
        var bonusesHit = [];
        var bonuses = config.bonuses || [];
        for (var j = 0; j < bonuses.length; j++) {
            var bonus = bonuses[j];
            var observed = stats[bonus.stat] || 0;
            if (observed >= bonus.gte) {
                bonusTotal += bonus.points;
                bonusesHit.push(bonus.id || bonus.stat);
            }
        }
        if (bonusTotal) {
            components._bonuses = bonusTotal;
            total += bonusTotal;
        }

        var dstPoints = dstTierPoints(stats, config);
        if (dstPoints !== null) {
            components._dst_points_allowed = dstPoints;
            total += dstPoints;
        }

        return { total: total, components: components, bonuses_hit: bonusesHit };
    }

    function score(stats, config) {
        return scoreDetail(stats, config).total;
    }

    return {
        score: score,
        scoreDetail: scoreDetail,
        unprojectableRules: unprojectableRules,
        sortedKeys: sortedKeys
    };
}());

/* Node/CommonJS if anyone ever runs it there; harmless under JScript and browsers. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = Scoring;
}
