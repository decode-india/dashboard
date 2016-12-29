import * as React from "react";

import { Dimensions, Measure } from "../Measure";

let ReactList = require("react-list");

export interface ListProps {
    itemRenderer: (index: number, key: string) => JSX.Element;
    onSelect?: (index: number) => void;
    onScroll?: (event: React.UIEvent) => void;
    length: number;
    type: string;
}

interface ListState {
    dimens: Dimensions;
}

export class List extends React.Component<ListProps, ListState> {

    constructor(props: ListProps) {
        super(props);
        this.state = {
            dimens: undefined
        };
    }

    updateDimensions(dimensions: Dimensions) {
        this.state.dimens = dimensions;
        this.setState(this.state);
    }

    render(): JSX.Element {
        let parentStyle = (this.state.dimens) ? { overflowY: "scroll", height: this.state.dimens.height } : {};
        return (
            <Measure
                onMeasure={this.updateDimensions.bind(this)} >
                <div style={parentStyle} onScroll={this.props.onScroll}>
                    <ReactList
                        itemRenderer={this.props.itemRenderer}
                        length={this.props.length}
                        type={this.props.type} />
                </div>
            </Measure>
        );
    }
}

export default List;