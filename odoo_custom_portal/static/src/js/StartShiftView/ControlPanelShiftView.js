/** @odoo-module **/

import ControlPanel from 'web.ControlPanel';
import session from 'web.session';

const { onWillStart, onWillUpdateProps } = owl;

export class ShiftViewControlPanel extends ControlPanel {

    setup() {
        super.setup();

        // onWillStart(() => this._loadWidgetData());
        // onWillUpdateProps(() => this._loadWidgetData());
    }

    _loadWidgetData() {
        console.log('sdf')

    }

    // async onStatusClick(ev) {
    //     ev.preventDefault();
    //     await this.trigger('do-action', {
    //         action: "project.project_update_all_action",
    //         options: {
    //             additional_context: {
    //                 default_project_id: this.project_id,
    //                 active_id: this.project_id
    //             }
    //         }
    //     });
    // }
}
ShiftViewControlPanel.template = "odoo_custom_portal.ShiftViewControlPanel";