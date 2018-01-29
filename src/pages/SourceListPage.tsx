import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router";
import { replace } from "react-router-redux";

import { Button } from "react-toolbox/lib/button";
import {AmazonFlowFlag, setAmazonFlow} from "../actions/session";
import AmazonVendorPane from "../components/AmazonVendorPane";
import List from "../components/List/List";
import ListItem from "../components/List/ListItem";
import TwoPane from "../components/TwoPane";
import Source from "../models/source";
import { User } from "../models/user";
import { State } from "../reducers";
import ArrayUtils from "../utils/array";

import WelcomePage from "./WelcomePage";

const ButtonTheme = require("../themes/button_theme.scss");

export interface SourceListPageProps {
    sources: Source[];
    finishLoading: boolean;
    user: User;
    amazonFlow: boolean;
    setAmazonFlow: (amazonFlow: boolean) => AmazonFlowFlag;
    goTo: (path: string) => (dispatch: Redux.Dispatch<any>) => void;
}

interface SourceListPageState {
    listItems: JSX.Element[];
}

function mapStateToProps(state: State.All) {
    return {
        sources: state.source.sources,
        finishLoading: state.source.finishLoading,
        amazonFlow: state.session.amazonFlow,
        user: state.session.user
    };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<any>) {
    return {
        setAmazonFlow: function (amazonFlow: boolean): AmazonFlowFlag {
            return dispatch(setAmazonFlow(amazonFlow));
        },
        goTo: function (path: string): any {
            return dispatch(replace(path));
        },
    };
}

export class SourceListPage extends React.Component<SourceListPageProps, SourceListPageState> {
    static defaultProps: SourceListPageProps = {
        sources: [],
        amazonFlow: false,
        finishLoading: false,
        user: undefined,
        setAmazonFlow: undefined,
        goTo: undefined,
    };

    render() {
        let leftSide = (
            <div className="source_list_page_left" style={{ position: "relative", height: "100%" }}>
                {
                    this.props.finishLoading &&
                    <SourceList sources={ArrayUtils.sortArrayByProperty(this.props.sources, "name")} />
                }
                <Link to="/skills/new" style={{ position: "absolute", bottom: "5%", right: "5%" }}>
                    <Button theme={ButtonTheme} icon="add" accent mini floating />
                </Link>
            </div>
        );

        let rightSide = (
            <div className="source_list_page_right">
                <WelcomePage />
            </div>
        );

        return this.props.amazonFlow ? (<AmazonVendorPane spacing={true} user={this.props.user} amazonFlow={this.props.amazonFlow} setAmazonFlow={this.props.setAmazonFlow} goTo={this.props.goTo} />) :
            (
                <TwoPane
                    spacing={true}
                    leftStyle={{ paddingLeft: "10px", paddingRight: "5px" }}
                    rightStyle={{ paddingRight: "10px", paddingLeft: "5px" }}>
                    {leftSide}
                    {rightSide}
                </TwoPane>
            );
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SourceListPage);

interface SourceListProps {
    sources: Source[];
}

interface SourceListState {
}

class SourceList extends React.Component<SourceListProps, SourceListState> {

    constructor(props: SourceListProps) {
        super(props);

        this.renderItem = this.renderItem.bind(this);
    }

    renderItem(index: number, key: string): JSX.Element {
        let source = this.props.sources[index];
        const secondaryValue = (source.created) ? moment(source.created).format("MMM Do, YYYY") : " ";
        return (
            <ListItem
                key={source.id}
                index={index}
                primaryValue={source.name}
                routeTo={"/skills/" + source.id}
                secondaryValue={secondaryValue} />
        );
    }

    render() {
        let element = (this.props.sources.length === 0) ?
            (
                <ul style={{ marginTop: "40px", fontSize: "1.1em" }}>
                    <li style={{ listStyle: "none", fontSize: "1.3em", marginLeft: "-20px", marginBottom: "5px" }}>You have not created any sources yet:</li>
                    <li>Setup a new source to begin logging and monitoring your skills and actions</li>
                    <li><Link to={"/skills/new"}>Just click here</Link> to get started (or on the "+" button below)</li>
                </ul>
            )
            :
            (
                <List
                    itemRenderer={this.renderItem}
                    length={this.props.sources.length} />
            );
        return element;
    }
}
