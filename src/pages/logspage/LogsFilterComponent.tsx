import * as React from "react";

import * as Filters from "./Filters";

import { ComponentSelector, SelectableComponent } from "../../components/ComponentSelector";
import { FormInput } from "../../components/FormInput";
import { Select, SelectAdapter } from "../../components/Select";
import { LOG_LEVELS } from "../../constants";

import Log from "../../models/log";

export interface LogsFilterComponentProps {
    onFilter: (filter?: Filters.FilterType) => void;
}

interface LogsFilterComponentState {
    selectedComponent: SelectableComponent;
}

export class LogsFilterComponent extends React.Component<LogsFilterComponentProps, LogsFilterComponentState> {

    filterComponents: FilterComponent[];
    selectableComponents: SelectableComponent[];

    constructor(props: LogsFilterComponentProps) {
        super(props);
        this.filterComponents = [];
        this.filterComponents.push(new IDFilterComponent(this.props.onFilter));
        this.filterComponents.push(new TypeFilterComponent(this.props.onFilter));

        this.selectableComponents = [];
        for (let fc of this.filterComponents) {
            this.selectableComponents.push(fc.comp);
        }
    }

    onSelected(index: number, component: SelectableComponent) {
        let filtComp = this.filterComponents[index];
        filtComp.startFilter();
    }

    onUnselected() {
        this.props.onFilter(undefined);
    }

    render() {
        return (<ComponentSelector components={this.selectableComponents} onSelected={this.onSelected.bind(this)} onUnselected={this.onUnselected.bind(this)} />);
    }
}

export default LogsFilterComponent;

abstract class FilterComponent {

    onFilter: (type: Filters.FilterType) => void;
    comp: SelectableComponent;

    constructor(onFilter: (type: Filters.FilterType) => void) {
        this.onFilter = onFilter;
    }

    abstract filterType(): Filters.FilterType;

    startFilter() {
        this.onFilter(this.filterType());
    }
}

class IDFilterComponent extends FilterComponent {

    filter: Filters.IDFilter;
    input: FormInput;

    constructor(onFilter: (type: Filters.FilterType) => void) {
        super(onFilter);
        this.filter = new Filters.IDFilter();
        this.comp = new SingleInputSelectableComponent("ID", this.handleChange.bind(this));
    }

    handleChange(value: string) {
        this.filter.id = value;
        this.startFilter();
    }

    filterType(): Filters.FilterType {
        return this.filter;
    }
}

class TypeFilterComponent extends FilterComponent implements SelectAdapter<LOG_LEVELS> {

    types: LOG_LEVELS[];
    filter: Filters.TypeFilter;
    input: FormInput;

    constructor(onFilter: (type: Filters.FilterType) => void) {
        super(onFilter);
        this.types = [];
        this.types.push("INFO");
        this.types.push("DEBUG");
        this.types.push("WARN");
        this.types.push("ERROR");
        this.filter = new Filters.TypeFilter();
        this.comp = new SingleSelectSelectableComponent<string>("Type", this, this.onSelected.bind(this));
    }

    getCount(): number {
        return this.types.length;
    }

    getItem(index: number): LOG_LEVELS {
        return this.types[index];
    }

    getTitle(index: number): string {
        return this.types[index];
    }

    filterType(): Filters.FilterType {
        return this.filter;
    }

    onSelected(item: LOG_LEVELS) {
        this.filter.logType = item;
        this.startFilter();
    }
}

class SingleInputSelectableComponent implements SelectableComponent {

    title: string;
    onChange: (input: string) => void;

    constructor(title: string, onChange: (input: string) => void) {
        this.title = title;
        this.onChange = onChange;
    }

    handleChange(formEvent: React.FormEvent) {
        let target = formEvent.target as HTMLSelectElement;
        this.onChange(target.value);
    }

    get component(): JSX.Element {
        return (<FormInput label={this.title} type="text" value="" onChange={this.handleChange.bind(this)} />);
    }
}

class SingleSelectSelectableComponent<T> implements SelectableComponent {
    hint: string;
    adapter: SelectAdapter<T>;
    selectListener: (item?: T) => void;

    constructor(hint: string, adapter: SelectAdapter<T>, onSelected: (item?: T) => void) {
        this.hint = hint;
        this.adapter = adapter;
        this.selectListener = onSelected;
    }

    onSelected(item: T, index: number) {
        this.selectListener(item);
    }

    get title(): string {
        return this.hint;
    }

    get component(): JSX.Element {
        return (<Select hint={this.hint} adapter={this.adapter} onSelected={this.onSelected.bind(this)} />);
    }
}