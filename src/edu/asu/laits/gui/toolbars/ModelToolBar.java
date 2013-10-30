/** (c) 2013, Arizona Board of Regents for and on behalf of Arizona State University.
 * This file is part of LAITS.
 *
 * LAITS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LAITS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.

 * You should have received a copy of the GNU Lesser General Public License
 * along with LAITS.  If not, see <http://www.gnu.org/licenses/>.
 */

package edu.asu.laits.gui.toolbars;

import edu.asu.laits.editor.ApplicationContext;
import edu.asu.laits.gui.MainMenu;
import edu.asu.laits.gui.MainWindow;
import edu.asu.laits.gui.menus.ModelMenu;
import javax.swing.JToolBar;
import javax.swing.JButton;
import java.awt.Font;
import java.awt.event.ActionEvent;
import javax.swing.Box;
import org.apache.log4j.Logger;
import org.jgraph.graph.CellView;

/**
 * ToolBar for Model functionalities Provides Add Node and Run Model buttons on
 * the ToolBar
 *
 * @author rptiwari
 *
 */
public class ModelToolBar extends JToolBar {

    private JButton addNodeButton = null;
    private JButton deleteNodeButton = null;
    private JButton showForumButton = null;
    private JButton doneButton = null;
    private JButton showGraphButton = null;
    private JButton showTableButton = null;
    private ModelMenu modelMenu;

    private static Logger logs = Logger.getLogger("DevLogs");
    private static Logger activityLogs = Logger.getLogger("ActivityLogs");
    
    /**
     * This method initializes The ToolBar buttons for Model
     *
     */
    public ModelToolBar(ModelMenu modelMenu) {
        super();
        this.modelMenu = modelMenu;
        initialize();
    }

    /**
     * This method initializes this
     *
     */
    private void initialize() {
        setName("Model quickmenu");
        add(getAddNodeButton());
        add(Box.createHorizontalStrut(5));
        add(getDeleteNodeButton());
        add(Box.createHorizontalStrut(5)); 
        add(getshowGraphButton());
        
        if(!ApplicationContext.isAuthorMode()){
            add(Box.createHorizontalStrut(5));
            add(getDoneButton());
        }
        // Disable Delete Node button for all the modes. Delete Node button from
        // Menu and Toolbar will be enabled and disabled at the same time based on
        // Vertex selection listeners.
        disableDeleteNodeButton();
        
        add(Box.createHorizontalStrut(5)); 
        add(getShowTableButton());
        add(Box.createHorizontalStrut(5)); 
        add(getShowForumButton());
    }

    /**
     * This method initializes Add Note button on the ToolBar
     */
    public JButton getAddNodeButton() {
        if (addNodeButton == null) {
            addNodeButton = new JButton();
            addNodeButton.setText("Create Node");
            addNodeButton.setToolTipText("Create a New Node");
            addNodeButton.setFont(new Font(addNodeButton.getFont().getName(),
                                           Font.BOLD,
                                           addNodeButton.getFont().getSize() - 1));
            addNodeButton
                    .addActionListener(new java.awt.event.ActionListener() {
                public void actionPerformed(java.awt.event.ActionEvent e) { 
                    activityLogs.debug("User Pressed 'Create Node' Button from toolbar");
                    modelMenu.newNodeAction();
                }
            });
        }
        
        return addNodeButton;
    }
    
    public JButton getDeleteNodeButton() {
        if (deleteNodeButton == null) {
            deleteNodeButton = new JButton();
            deleteNodeButton.setText("Delete Node");
            deleteNodeButton.setToolTipText("Delete selected Node");
            deleteNodeButton.setFont(new Font(deleteNodeButton.getFont().getName(),
                                           Font.BOLD,
                                           deleteNodeButton.getFont().getSize() - 1));
            deleteNodeButton
                    .addActionListener(new java.awt.event.ActionListener() {
                public void actionPerformed(java.awt.event.ActionEvent e) {
                    activityLogs.debug("User Pressed 'Delete Node' Button from Toolbar");
                    modelMenu.deleteNodeAction();
                }
            });
        }
        return deleteNodeButton;
    }

    /*
     * This method is used to get 'Show Table' button on
     * model toolbar
     */
    private JButton getShowTableButton() {
      if(showTableButton == null) {
          showTableButton  = new JButton();
          showTableButton.setText("Show Table");
          showTableButton.setToolTipText("Display Tabular output");
          showTableButton.setFont(new Font(showTableButton.getFont().getName(),
                                   Font.BOLD,
                                   showTableButton.getFont().getSize() - 1));
          showTableButton.addActionListener(new java.awt.event.ActionListener() {
              public void actionPerformed(ActionEvent e) {
                  activityLogs.debug("User Pressed 'Show Table' Button from toolbar");
                  modelMenu.showNodeTable();
              }
          });
      }
      
      return showTableButton;
    }
    
    /**
     * This method initializes Done Button on ToolBar. 
     * Done button is used in non-author mode to indicate that student has finished 
     * solving the assigned problem
     */
    private JButton getshowGraphButton() {
        if (showGraphButton == null) {
            showGraphButton = new JButton();
            showGraphButton.setText("Show Graph");  
            showGraphButton.setToolTipText("Display Node's Graph");
            showGraphButton.setFont(new Font(showGraphButton.getFont().getName(),
                                   Font.BOLD,
                                   showGraphButton.getFont().getSize() - 1)
                                  );
            showGraphButton
                    .addActionListener(new java.awt.event.ActionListener() {
                public void actionPerformed(java.awt.event.ActionEvent e) {
                    activityLogs.debug("User Pressed 'Show Graph' Button from toolbar");
                    modelMenu.showNodeGraph();
                }
            });            
        }
        return showGraphButton;
    }
    
    /**
     * This method initializes Done Button on ToolBar
     */
    private JButton getDoneButton() {
        if (doneButton == null) {
            doneButton = new JButton();
            doneButton.setText("Done");  
            doneButton.setToolTipText("Done with the Task");
            doneButton.setFont(new Font(doneButton.getFont().getName(),
                                   Font.BOLD,
                                   doneButton.getFont().getSize() - 1)
                                  );
            doneButton
                    .addActionListener(new java.awt.event.ActionListener() {
                public void actionPerformed(java.awt.event.ActionEvent e) {
                    activityLogs.debug("User Pressed 'Done' Button from toolbar");
                    modelMenu.doneButtonAction();
                }
            });
            //disableDoneButton();
        }
        return doneButton;
    }
    
    /**
     * This method initializes Discussion button on ToolBar - not in Menu right now
     */
    private JButton getShowForumButton() {
        if (showForumButton == null) {
            showForumButton = new JButton();
            showForumButton.setText("Show Forum");  
            showForumButton.setToolTipText("Discussion about this Model");
            showForumButton.setFont(new Font(showForumButton.getFont().getName(),
                                   Font.BOLD,
                                   showForumButton.getFont().getSize() - 1)
                                  );
            showForumButton
                    .addActionListener(new java.awt.event.ActionListener() {
                public void actionPerformed(java.awt.event.ActionEvent e) {
                    activityLogs.debug("User Pressed 'Show Forum' Button from toolbar");
                    modelMenu.showForumButtonAction();                    
                }
            });
        }
        return showForumButton;
    }
    
    // Public methods used by selection listeners to enable/disable menu and toolbar items
    public void enableDoneButton(){
        doneButton.setEnabled(true);
    }
    
    public void disableDoneButton(){    
        doneButton.setEnabled(false);
    }
    
    public void enableDeleteNodeButton(){
        deleteNodeButton.setEnabled(true);
        modelMenu.enableDeleteNodeMenu();
    }
    
    public void disableDeleteNodeButton(){
        deleteNodeButton.setEnabled(false);
        modelMenu.disableDeleteNodeMenu();
    }
    public void enableShowGraphMenu() {
        showGraphButton.setEnabled(true);
        modelMenu.enableShowGraphMenu();
    }

    public void disableShowGraphMenu() {
        showGraphButton.setEnabled(false);
        modelMenu.disableShowGraphMenu();
    }
}
