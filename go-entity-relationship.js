Vue.component("go-entity-relationship", {
    data: function () {
        return {
            nodeData: [],
            linkData: [],
            myDiagram: null,
            settings: false,
            url: 'api.json'
        }
    },
    template: `
    <div>
    <div>
     <button class="btn btn-success" @click="sendRequestAndGetJson('api2.json')">Ver diagrama</button>
        <div class="row">
            <div class="col">
                <button class="btn btn-link settingsButton" @click="showSettings"><i class="fas fa-cog fa-lg"></i></button>
            </div>
        </div>


        <div class="row settings" v-if="settings">
            <div class="col-xs-4 col-md-5">
                <h4>Graph Layout</h4>

                <button class="btn btn-outline-secondary  optionButton" @click="FDLayout()">Force Directed
                    Layout</button>
                <button class="btn btn-outline-secondary optionButton" @click="GLayout()">Grid Layout</button>
                <button class="btn btn-outline-secondary optionButton" @click="TLayout()">Tree Layout</button>
                <button class="btn btn-outline-secondary optionButton" @click="LDLayout()"> Layered Digraph
                    Layout</button>
                <button class="btn btn-outline-secondary  optionButton" @click="CLayout()"> Circular Layout</button>
            </div>
            <div class="col-xs-3 col-md-2">
                <h4>Attributes</h4>

                <button class="btn btn-outline-secondary optionButton" @click="setAllAttributeVisibilty(false)">Hide
                    Attributes</button>
                <button class="btn btn-outline-secondary optionButton" @click="setAllAttributeVisibilty(true)"> Show
                    Attributes</button>

            </div>
        </div>
    </div>
    <div id='myDiagram'></div>
</div>
    `,
    methods: {
        showSettings() {
            this.settings = !this.settings;
        },
        sendRequestAndGetJson(url) {
            this.drawDiagram(url)  ;
        },
        drawDiagram: async function (url) {
           let json = await this.getJSON(url);
            this.nodeData = json.nodes;
            this.linkData = json.links;


            if (this.nodeData == false || this.nodeData == false) return;

            let $ = go.GraphObject.make; // for conciseness in defining templates

            // Add Random colors
            this.nodeData = this.nodeData.map(e => {
                e.items = e.items.map(e2 => {
                    e2.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
                    return e2;
                });
                return e;
            });
            // Create only one time
            if (!this.myDiagram)
                this.myDiagram =
                    $(go.Diagram, "myDiagram", // must name or refer to the DIV HTML element
                        {
                            allowDelete: false,
                            allowCopy: false,
                            layout: $(go.ForceDirectedLayout),
                            "undoManager.isEnabled": true
                        });

            // the template for each attribute in a node's array of item data
            var itemTempl =
                $(go.Panel, "Horizontal",
                    $(go.Shape, {
                        desiredSize: new go.Size(15, 15),
                        strokeJoin: "round",
                        strokeWidth: 5,
                        stroke: null,
                        margin: 2
                    },
                        new go.Binding("figure", "figure"),
                        new go.Binding("fill", "color"),
                        new go.Binding("stroke", "color")),
                    $(go.TextBlock, {
                        stroke: "#333333",
                        font: "bold 14px sans-serif"
                    },
                        new go.Binding("text", "name"))
                );

            // define the Node template, representing an entity
            this.myDiagram.nodeTemplate =
                $(go.Node, "Auto", // the whole node panel
                    {
                        selectionAdorned: true,
                        resizable: true,
                        layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
                        fromSpot: go.Spot.AllSides,
                        toSpot: go.Spot.AllSides,
                        isShadowed: true,
                        shadowOffset: new go.Point(3, 3),
                        shadowColor: "#C5C1AA"
                    },
                    new go.Binding("location", "location").makeTwoWay(),
                    // whenever the PanelExpanderButton changes the visible property of the "LIST" panel,
                    // clear out any desiredSize set by the ResizingTool.
                    new go.Binding("desiredSize", "visible", function (v) {
                        return new go.Size(NaN, NaN);
                    }).ofObject("LIST"),
                    // define the node's outer shape, which will surround the Table
                    $(go.Shape, "RoundedRectangle", {
                        fill: 'white',
                        stroke: "#eeeeee",
                        strokeWidth: 3
                    }),
                    $(go.Panel, "Table", {
                        margin: 8,
                        stretch: go.GraphObject.Fill
                    },
                        $(go.RowColumnDefinition, {
                            row: 0,
                            sizing: go.RowColumnDefinition.None
                        }),
                        // the table header
                        $(go.TextBlock, {
                            row: 0,
                            alignment: go.Spot.Center,
                            margin: new go.Margin(0, 24, 0, 2), // leave room for Button
                            font: "bold 16px sans-serif"
                        },
                            new go.Binding("text", "key")),
                        // the collapse/expand button
                        $("PanelExpanderButton", "LIST", // the name of the element whose visibility this button toggles
                            {
                                row: 0,
                                alignment: go.Spot.TopRight
                            }),
                        // the list of Panels, each showing an attribute
                        $(go.Panel, "Vertical", {
                            name: "LIST",
                            row: 1,
                            padding: 3,
                            alignment: go.Spot.TopLeft,
                            defaultAlignment: go.Spot.Left,
                            stretch: go.GraphObject.Horizontal,
                            itemTemplate: itemTempl
                        },
                            new go.Binding("itemArray", "items"))
                    ) // end Table Panel
                ); // end Node

            // define the Link template, representing a relationship
            this.myDiagram.linkTemplate =
                $(go.Link, // the whole link panel
                    {
                        selectionAdorned: true,
                        layerName: "Foreground",
                        reshapable: true,
                        routing: go.Link.AvoidsNodes,
                        corner: 5,
                        curve: go.Link.JumpOver
                    },
                    $(go.Shape, // the link shape
                        {
                            stroke: "#303B45",
                            strokeWidth: 2.5
                        }),
                    $(go.TextBlock, // the "from" label
                        {
                            textAlign: "center",
                            font: "bold 14px sans-serif",
                            stroke: "#1967B3",
                            segmentIndex: 0,
                            segmentOffset: new go.Point(NaN, NaN),
                            segmentOrientation: go.Link.OrientUpright
                        },
                        new go.Binding("text", "text")),
                    $(go.TextBlock, // the "to" label
                        {
                            textAlign: "center",
                            font: "bold 14px sans-serif",
                            stroke: "#1967B3",
                            segmentIndex: -1,
                            segmentOffset: new go.Point(NaN, NaN),
                            segmentOrientation: go.Link.OrientUpright
                        },
                        new go.Binding("text", "toText"))
                );

            // create the model for the E-R diagram
            this.myDiagram.model = $(go.GraphLinksModel, {
                copiesArrays: true,
                copiesArrayObjects: true,
                nodeDataArray: this.nodeData,
                linkDataArray: this.linkData
            });
        },
        FDLayout() {
            if (this.myDiagram) {
                this.myDiagram.layout = new go.ForceDirectedLayout();
            }
        },

        GLayout() {
            if (this.myDiagram) {
                this.myDiagram.layout = new go.GridLayout();
            }
        },

        CLayout() {
            if (this.myDiagram) {
                this.myDiagram.layout = new go.CircularLayout();
            }
        },

        LDLayout() {
            if (this.myDiagram) {
                this.myDiagram.layout = new go.LayeredDigraphLayout();
            }
        },

        TLayout() {
            if (this.myDiagram) {
                this.myDiagram.layout = new go.TreeLayout();
            }
        },

        groupFDLayout(e, obj) {
            var group = this.myDiagram.findNodeForData(obj.part.data);
            group.layout = new go.ForceDirectedLayout();
            group.invalidateLayout();
        },

        groupGLayout(e, obj) {
            var group = this.myDiagram.findNodeForData(obj.part.data);
            group.layout = new go.GridLayout();
            group.invalidateLayout();
        },

        groupCLayout(e, obj) {
            var group = this.myDiagram.findNodeForData(obj.part.data);
            group.layout = new go.CircularLayout();
            group.invalidateLayout();
        },

        groupLDLayout(e, obj) {
            var group = this.myDiagram.findNodeForData(obj.part.data);
            group.layout = new go.LayeredDigraphLayout();
            group.invalidateLayout();
        },

        groupTLayout(e, obj) {
            var group = this.myDiagram.findNodeForData(obj.part.data);
            group.layout = new go.TreeLayout();
            group.invalidateLayout();
        },

        setAllAttributeVisibilty(visible) {
         
            if (this.myDiagram) {
                this.myDiagram.model.startTransaction("Set Attribute Visibility");
                this.myDiagram.nodes.each(function (node) {
                    // Nodes
                    var list = node.findObject("LIST");
                    if (list)

                        list.visible = visible;

                    // Groups (don't apply to expanded groups, which should always have attributes hidden)
                    list = node.findObject("LIST");
                    if (list && !node.isSubGraphExpanded)
                        list.visible = visible;
                });
                this.myDiagram.model.commitTransaction("Set Attribute Visibility");
            }
        },
        setAbstractView(useAbstract) {
            console.log(useAbstract,"useAbstract");
            if (useAbstract !== project.abstractSchema) {
                project.abstractSchema = useAbstract;
                projectService.addProject(project);
                getSchemaAndRelations();
            }
        },

        setForeignKeyCandidateVisibility(visible) {
            if (visible !== project.showForeignKeyCandidates) {
                project.showForeignKeyCandidates = visible;
                projectService.addProject(project);
                getSchemaAndRelations();
            }
        },

        async getJSON(url) {
            return fetch(url).then(res => res.json())
        },
        
    },
    watch: {
        url: function () {
            this.drawDiagram(this.url);
        },
    },
  
    mounted() {
        this.drawDiagram(this.url);
    }

});
