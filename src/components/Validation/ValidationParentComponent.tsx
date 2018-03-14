import * as React from "react";
import {IconButton} from "react-toolbox";
import Checkbox from "react-toolbox/lib/checkbox";
import Input from "react-toolbox/lib/input";
import ProgressBar from "react-toolbox/lib/progress_bar";
import Snackbar from "react-toolbox/lib/snackbar";
import Tooltip from "react-toolbox/lib/tooltip";
import Button from "../Button";
import {Cell, Grid} from "../Grid/index";
import {Title} from "../Title";
import EventHandler = __React.EventHandler;
import Source from "../../models/source";
import SourceService from "../../services/source";
import {ValidationResultComponent} from "./ValidationResultComponent";
import {ValidationTestComponent} from "./ValidationTestComponent";

const inputTheme = require("../../themes/input.scss");
const checkboxTheme = require("../../themes/checkbox-theme.scss");
const buttonStyle = require("../../themes/amazon_pane.scss");
const validationStyle = require("./ValidationParentComponentStyle.scss");

export interface ValidationParentComponentProps {
    handleRun: (e: any) => void;
    source: Source;
    sources: any[];
    getSources: () => Promise<Source[]>;
    setSource: (source: Source) => (dispatch: Redux.Dispatch<any>) => void;
    handleSelectedSource: (value: any) => void;
    handleTokenChange: (value: string) => void;
    handleGetTokenClick: EventHandler<any>;
    handleSnackbarClick: () => any;
    handleVendorIDChange: (value: string) => void;
    token: string;
    showSnackbar: boolean;
    snackbarLabel: string;
    vendorID: string;
    script: string;
    scriptHint: any;
    handleScriptChange: (value: string) => void;
    handleHelpChange: (e: any) => void;
    showHelp: boolean;
    validationHelp: JSX.Element;
    loadingValidationResults: boolean;
    dialogActive: boolean;
    handleDialogToggle: () => any;
    validationResults: any;
    monitorEnabled: boolean;
    handleMonitorEnabledCheckChange: (value: boolean) => any;
    setLoading: (value: boolean) => (dispatch: Redux.Dispatch<any>) => void;
    handleShowSnackbarEnableMonitoring: () => any;
}

interface ValidationParentComponentState {
    enableValidation?: boolean;
    showMessage?: boolean;
}

const TooltipButton = Tooltip(IconButton);

export class ValidationParentComponent extends React.Component<ValidationParentComponentProps, ValidationParentComponentState> {

    constructor(props: ValidationParentComponentProps) {
        super(props);

        this.handleSaveScript = this.handleSaveScript.bind(this);
        this.updateSourceObject = this.updateSourceObject.bind(this);
        this.handleEnableValidation = this.handleEnableValidation.bind(this);

        this.state = {
            enableValidation: false,
            showMessage: false,
        };
    }

    componentWillReceiveProps(nextProps: ValidationParentComponentProps) {
        if (nextProps.source) {
            this.setState((prevState) => ({
                ...prevState,
                enableValidation: nextProps.source.validation_enabled,
            }));
        }
    }

    async updateSourceObject (source: Source) {
        this.props.setLoading(true);
        await SourceService.updateSourceObj(source);
        const updatedSource = await SourceService.getSourceObj(this.props.source.id);
        await this.props.setSource(updatedSource);
        await this.props.getSources();
        this.setState((prevState) => ({
            showMessage: false,
            enableValidation: !prevState.enableValidation,
        }));
        this.props.setLoading(false);
    }

    async handleSaveScript () {
        try {
            const sourceToUpdate = {...this.props.source, validation_script: this.props.script};
            // update source with script on firebase
            await this.updateSourceObject(sourceToUpdate);
        } catch (err) {
            // TODO: return error to user if needed
            console.log(err);
        }
    }

    async handleEnableValidation () {
        // adding this to allow user to disable monitoring even if he doesn't have vendor or token
        // this.state.enableValidation means is already active so handleEnableValidation will disable it
        if ((this.props.token && this.props.vendorID) || this.state.enableValidation) {
            const validation_enabled = !this.state.enableValidation;
            const sourceToUpdate = {...this.props.source, validation_enabled, validation_script: this.props.script};
            await this.updateSourceObject(sourceToUpdate);
        } else {
            this.props.handleShowSnackbarEnableMonitoring();
        }
    }

    render() {
        const redirectoToVendorIdpage = () => window.open("https://developer.amazon.com/mycid.html", "_blank");
        const scriptIsNotSaved = this.props && this.props.source && (this.props.script !== this.props.source.validation_script);
        const validationEnabledStyle = this.state.enableValidation ? buttonStyle.enabled : "";
        return (
            <form onSubmit={this.props.handleRun}>
                <Cell col={12} tablet={12}>
                    <Grid>
                        <Cell col={7} tablet={8} phone={6}>
                            {
                                this.props.source && this.props.source.id &&
                                (
                                    <Title
                                        sources={this.props.sources}
                                        handleItemSelect={this.props.handleSelectedSource}
                                        selectedSourceId={this.props.source.id}/>
                                )
                            }
                        </Cell>
                        <Cell style={{position: "relative"}} col={5} hideTablet={true} hidePhone={true}>
                            <TooltipButton className={buttonStyle.info_button} icon={"info"} tooltip={"Enable Monitoring and get notified instantly when there is a change in your validation results overtime."} />
                            {this.props && !this.props.vendorID && <TooltipButton className={buttonStyle.vendor_id_tooltip} onClick={redirectoToVendorIdpage} icon={"info"} tooltip={"Enter the vendor ID from your Amazon account at developer.amazon.com/mycid.html."} />}
                            <div className={`${buttonStyle.enable_monitoring} ${validationEnabledStyle}`} >
                                <div>
                                    <span>{this.state.enableValidation ? "DISABLE" : "ENABLE"}</span>
                                    <span>MONITORING</span>
                                </div>
                                <IconButton icon={"power_settings_new"} onClick={this.handleEnableValidation} />
                            </div>
                            <div className={validationStyle.token_container}>
                                <span>Validation Token:</span>
                                {
                                    (this.props && this.props.token &&
                                        (
                                            <Input theme={inputTheme}
                                                   className={`sm-input ${inputTheme.validation_input}`}
                                                   label="Validation Token" value={this.props.token}
                                                   onChange={this.props.handleTokenChange} required={true}/>
                                        )
                                    ) ||
                                    <a className={`${validationStyle.get_token}`} href="#" onClick={this.props.handleGetTokenClick}>Get validation token</a>
                                }
                            </div>
                            <Snackbar className="sm-snackbar" action="Dismiss" type="cancel"
                                      active={this.props.showSnackbar}
                                      label={this.props.snackbarLabel}
                                      onClick={this.props.handleSnackbarClick}/>
                            <div className={validationStyle.token_container}>
                                <span>Vendor ID:</span>
                                <Input theme={inputTheme} className={`sm-input ${inputTheme.validation_input} ${inputTheme.vendor_input}`} label="Vendor ID" value={this.props.vendorID}
                                       onChange={this.props.handleVendorIDChange} required={true}/>
                            </div>
                        </Cell>
                    </Grid>
                </Cell>
                <Cell className={validationStyle.main_container} col={12}>
                    <ValidationTestComponent script={this.props.script || ""} handleScriptChange={this.props.handleScriptChange} />
                    <ValidationResultComponent unparsedHtml={this.props.validationResults} />
                </Cell>
                <Cell col={12}>
                    {this.props.showHelp ? this.props.validationHelp : undefined}
                </Cell>
                <Cell className={`${validationStyle.button_container} ${validationStyle.left}`} col={2}>
                    <Button type="button" onClick={this.handleSaveScript} className={buttonStyle.validation_button} primary={true} raised={true} disabled={!scriptIsNotSaved}>
                        <span>Save script</span>
                    </Button>
                </Cell>
                <Cell className={`${validationStyle.button_container} ${validationStyle.right}`} offset={8} col={2}>
                    <Button className={buttonStyle.validation_button} primary={true} raised={true} disabled={this.props.loadingValidationResults}>
                        {this.props.loadingValidationResults
                            ?
                            <ProgressBar className="circularProgressBar" type="circular" mode="indeterminate"/>
                            : <span>Run Skill ></span>}
                    </Button>
                </Cell>
                <Cell col={12}>
                    {
                        this.state.showMessage &&
                        <span className={validationStyle.validation_text}>Your script is not updated with the last changes you've made, make sure you save your script so the monitoring gets the latest changes</span>
                    }
                </Cell>
                <Cell style={{display: "none"}} col={12} className={`${inputTheme.checkbox}`}>
                    <Checkbox
                        theme={checkboxTheme}
                        label={"Enable Monitoring"}
                        checked={this.props.monitorEnabled}
                        onChange={this.props.handleMonitorEnabledCheckChange}/>
                </Cell>
            </form>
        );
    }
}

export default ValidationParentComponent;
