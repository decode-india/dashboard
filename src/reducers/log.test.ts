import { expect } from "chai";

import { fetchLogsRequest, setLogs } from "../actions/log";
import { dummyLogs } from "../utils/test";
import { log } from "./log";

describe("Log Reducer", function () {
    describe("fetch logs request action", function() {
        it("sets is loading to true", function() {
            let state = {
                isLoading: false
            };

            let newState = log(state, fetchLogsRequest());

            expect(newState.isLoading).to.be.true;
        });
    });
    describe("set logs action", function () {
        it("sets the logs", function () {

            let state = {
                isLoading: true
            };

            let action = setLogs(dummyLogs(4));
            let newState = log(state, action);

            expect(newState.logs).to.exist;
            expect(newState.logs).to.have.length(4);
            // Make sure the existing state is not modified
            expect(newState.isLoading).to.equal(state.isLoading);
        });
    });
    describe("unknown action", function () {
        it("passes the state through", function () {

            let state = {
                isLoading: false
            };

            let newState = log(state, { type: "" });

            expect(newState.isLoading).to.equal(state.isLoading);
            expect(newState.logs).to.be.undefined;
            expect(newState.error).to.be.undefined;
        });
    });
});