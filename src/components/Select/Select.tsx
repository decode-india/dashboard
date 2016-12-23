import * as React from "react";

import MDLComponent from "../MDLComponent";

// Import the style
require("./getmdl-select");

export interface SelectAdapter<T> {
    getCount(): number;
    getItem(index: number): T;
    getTitle(index: number): string;
}

export interface SelectProps<T> {
    hint: string;
    adapter: SelectAdapter<T>;
    defaultIndex?: number;
    inputStyle?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    iconStyle?: React.CSSProperties;
    onSelected?(item: T, index: number): void;
}

interface SelectState {
    list: React.ReactNode[];
    lastSelectedIndex: number;
}

/**
 * A Select menu which can be used to select a single item in a list.  The list is taken from the
 * corresponding SelectAdapter provided.  As of writing this, the top item will be an "unselect" option which will be titled based
 * on the provided HINT.
 */
export class Select extends MDLComponent<SelectProps<any>, SelectState> {

    // This is checked and increased internally so there can always be a unique "ID" for the input.  Otherwise you get a lot of really frustrating errors in the DOM.
    static count: number = 0;

    id: string;
    dropdownRef: HTMLElement;
    inputRef: HTMLElement;
    menuRef: HTMLElement;
    liList: HTMLElement[];
    boundChangeListener: any;

    constructor(props: SelectProps<any>) {
        super(props);
        Select.count++;

        this.state = {
            list: [],
            lastSelectedIndex: this.props.defaultIndex || 0
        };
        this.setAdapter(props);

        this.id = "check-selection" + Select.count;
    }

    componentWillReceiveProps(nextProps: SelectProps<any>, nextContext: any): void {
        this.setAdapter(nextProps);
    }

    setAdapter(props: SelectProps<any>) {
        this.state.list = [];
        this.liList = [];

        // Then fill in the rest.
        let maxCount = props.adapter.getCount();
        for (let count = 0; count < maxCount; ++count) {
            let title = props.adapter.getTitle(count) || this.props.hint;
            let clickFunction = this.clickFunction(count).bind(this);
            let key = this.normalizeTitle(title) + count;
            this.state.list.push((
                <li ref={this.handleLiBind.bind(this)} className="mdl-menu__item" key={key} onClick={clickFunction}>{title}</li>
            ));
        }
    }

    /**
     * Normalizing the string so it can be put in a key field.
     */
    normalizeTitle(title: string): string {
        let useTitle = title || this.props.hint;
        return useTitle.replace(/\s/, "");
    }

    componentDidMount() {
        super.componentDidMount();
        // The input dom of the getmdl-select dispatches an "onchange" event on each selection.
        this.boundChangeListener = this.handleChange.bind(this);
        this.inputRef.addEventListener("onchange", this.boundChangeListener);
    }

    componentWillUnmount() {
        super.componentDidMount();
        this.inputRef.removeEventListener("onchange", this.boundChangeListener);
    }

    handleChange(index: number) {
        let item = this.props.adapter.getItem(index);
        if (this.props.onSelected) {
            this.props.onSelected(item, index);
        }
    }

    handleRefBind(input: HTMLElement) {
        if (input) {
            this.inputRef = input;
        }
    }

    handleMenuBind(menu: HTMLElement) {
        if (menu) {
            this.menuRef = menu;
        }
    }

    handleDropdownBind(dropdown: HTMLElement) {
        if (dropdown) {
            this.dropdownRef = dropdown;
        }
    }

    handleLiBind(li: HTMLElement) {
        if (li) {
            this.liList.push(li);
        }
    }

    handleInputKeyDown(ev: KeyboardEvent) {
        if (ev.charCode === 38 || ev.charCode === 40) {
            (this.menuRef as any)["MaterialMenu"].show();
        }
    }

    handleMenuKeyDown(ev: KeyboardEvent) {
        if (ev.charCode === 38) {
            this.inputRef.focus();
        }
    }

    clickFunction(index: number) {
        return (ev: React.SyntheticEvent) => {
            let useValue = this.props.adapter.getTitle(index);
            // "MaterialTextfield" is part of the `getmdl` library.  It's registered asyncronously apparently so it's no reliably there in unit tests.
            // Source: https://code.getmdl.io/1.2.1/material.min.js
            let dropdown: any = this.dropdownRef;
            if (dropdown.MaterialTextfield !== undefined) {
                dropdown.MaterialTextfield.change(useValue); // handles css class changes
                setTimeout(() => {
                    dropdown.MaterialTextfield.updateClasses_(); // update css class to remove focus
                }, 250);
            }

            // update input with the "id" value
            // TODO: This existed in the original code from where this was stolen, but seems to break things. Figure out why.
            // this.inputRef.id = li.id || "";
            this.handleChange(index);

            this.state.lastSelectedIndex = index;
            this.setState(this.state);
        };
    }

    render() {
        // You have to do this way or else you get some weird warning with React about going from controlled to uncontrolled states.
        let useValue = this.props.adapter.getTitle(this.state.lastSelectedIndex);

        return (
            <div ref={this.handleDropdownBind.bind(this)} className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label getmdl-select getmdl-select__fix-height getmdl-select__fullwidth">
                <input ref={this.handleRefBind.bind(this)} style={this.props.inputStyle} value={useValue} className="mdl-textfield__input" type="text" id={this.id} readOnly tabIndex={-1} onKeyDown={this.handleInputKeyDown.bind(this)} />
                <label htmlFor={this.id}>
                    <i style={this.props.iconStyle} className="mdl-icon-toggle__label material-icons">keyboard_arrow_down</i>
                </label>
                <label htmlFor={this.id} style={this.props.labelStyle} className="mdl-textfield__label">{this.props.hint}</label>
                <ul ref={this.handleMenuBind.bind(this)} onKeyDown={this.handleMenuKeyDown.bind(this)} htmlFor={this.id} className="mdl-menu mdl-menu--bottom-left mdl-js-menu">
                    {this.state.list}
                </ul>
            </div>
        );
    }
}

export default Select;