/*N.F. Abbate, P.E. Abbate.*/
/*Informe online del rendimiento de los cultivares de trigo pan evaluados en la RET-INASE de Argentina*/
	
	google.load("visualization", "1.1", {"packages":["corechart", "controls", "table"]});
	google.setOnLoadCallback(Inicia_Lugar);
	
	// Variables globales.
	var vinculo="https://docs.google.com/spreadsheets/d/1R8d8sctd4u4rj-xFueoShk4xGfcq2eBxfaKKuxU3deE/edit?usp=sharing"; 
	var titulo="Informe online de cultivares de trigo evaluados en la RET-INASE";
	var subregion="";
	var lugar="";
	var responsable="";	// Declaración necesaria para presentar la tabla.
	var media=0;				// Declaración necesaria para presentar la tabla.
	//var epoca_old;
	var nn=0;
	var campanias="";
	var actualizacion="24-may-2019";

	function Inicio() {
		// Funcion a ejecutar al iniciar la pagina para que no sea lenta la visualizacion de la pagina.
		
		// Carga un Lugar al control. 
		var x = document.getElementById("lugar");
		var z = document.createElement("option");
		z.value = "BALCA";
		z.text = "Subr. IV, Bs. As., Balcarce, INTA Balcarce";
		z.selected = true; // Lugar seleccionado.
		z.id = z.value; x.options.add(z, 0);
		window.responsable="P.E. Abbate";

		var epoca1="1ra (10-jun)";
		var x = document.getElementById("epocas");
		var z="";
		z = document.createElement("option");
		z.text = epoca1; x.options.add(z, 0);
		z = document.createElement("option");

		Actualizar_Detalles();	
	}
	
	function Inicia_Lugar() {
		// Inicia Lugares.
		var opciones="&gid=404337706&headers=1&tq="; // Hoja de lugares. 
		var querystr = "SELECT *"; 
		var query = new google.visualization.Query(window.vinculo+opciones+querystr);
		query.send(HandleQueryLugar); 
	} // Fin function.
		
	function HandleQueryLugar(response) {
		if (response.isError()) {
			alert("Error in query: " + response.getMessage() + "   " + response.getDetailedMessage());
			return;
		}
		
		// Los Lugares de la planilla deben estar ordenadas por orden de aparicion deseado en el control Select.
		var data_loc = response.getDataTable();
		var x = document.getElementById("lugar");
		var i=1;

		// Reemplaza los lugares ya cargados en el control por la primera de la planilla.
		x.options[0].text = data_loc.getValue(0, 2); // fila, col.
		x.options[0].value = data_loc.getValue(0, 1);
		x.options[0].id = data_loc.getValue(0, 1);

		for (var j = 1; j < data_loc.getNumberOfRows(); j++) {
			var z = document.createElement("option");
			z.text = data_loc.getValue(j, 2); // fila, col.
			z.value = data_loc.getValue(j, 1);
			if (data_loc.getValue(j, 1) == "BALCA") {z.selected = true}; // Lugar seleccionada.
			z.id = z.value; x.options.add(z, i); i=i+1;
		}	
		DrawChart();
	}	
	
	function DrawChart() {
		// Link a la planilla de datos:	
		Ocultar(true);
		Actualizar_Lugar_Epoca();
		var querystr = "SELECT *"; //PEA: Son las columnas de datos a mostrar.
		var query = new google.visualization.Query(window.vinculo+window.opciones+querystr);
		query.send(HandleQueryDrawChart); // Resuelve errores
	} // Fin function DrawChart.
		
	function HandleQueryDrawChart(response) {
		if (response.isError()) {
			alert("Error in query: " + response.getMessage() + "   " + response.getDetailedMessage());
			return;
		}
						
		// Crea un control CategoryFilter para Calidad.
		var crtgrupos = new google.visualization.ControlWrapper({
			controlType: "CategoryFilter",
			containerId: "grupos",
			options: {
				values: ["1", "2", "3"],
				filterColumnIndex: 4, // GC
				ui: {                                                   
					caption: "Seleccionar",
					sortValues: true,
					selectedValuesLayout: "aside", // "belowStacked",
					allowMultiple: true,
					allowTyping: false,
					labelStacking: "vertical",
					label: ""//"Grupo de calidad: (sin seleccionar se muestran todos)",
					//allowNone: false,
				}
			}
		});

	  // Selecciona las columnas de la planilla segun la cantidad de anios.
		// Las columnas se cuentan desde 0 (cero).
		var anios = document.getElementById("anios").value;   
		var data = response.getDataTable();
		var DAT=0, DF=0, CV=0, usado=0, campania1=17;
		if (anios==2) { 	
			DAT = 5; // Columna con datos (para promediar).
			DF = 8; // Columna con Desvisos%.
			CV = 11; // Columna con CV%.
			usado = 14; // Columna que identifica los datos usados.
		} else if (anios==3) { 	
			DAT = 6; // Columna con datos absolutos (para promediar).			
			DF = 9;
			CV = 12;
			usado = 15; 
		} else if (anios==4) { 	
			DAT = 7;			
			DF = 10;
			CV = 13;
			usado = 16; 
		}

		// Copia los datos de la planilla a una nueva tabla de datos.
		var data2 = new google.visualization.DataTable();
		data2.addColumn({type:"number", label: "Num.", role:"annotation", displayDateBarSeparator: false}); // 0: Orden.
		data2.addColumn(data.getColumnType(1), data.getColumnLabel(1)); 				// 1: Manejo.
		data2.addColumn(data.getColumnType(2), data.getColumnLabel(2)); 				// 2: Epoca.
		data2.addColumn(data.getColumnType(3), data.getColumnLabel(3)); 				// 3: Cultivar.
		data2.addColumn({type:"number", label:"GC"}); 													// 4: GC.
		data2.addColumn({type:"number", label:"DIF(%)"}); 								  		// 5: DIF%.
		data2.addColumn({type:"number", label:"CV(%)"}); 												// 6: CV%.
		data2.addColumn({type:"string", role:"tooltip"});                 			// 7: Cultivar tooltip.
		data2.addColumn({type:"number", label:"Usado"});                  			// 8: Usado.
		data2.addColumn({type:"string", label:"Fecha"});                  			// 9: Epoca con fecha.
		data2.addColumn(data.getColumnType(DAT), data.getColumnLabel(DAT)); 		// 10: Datos absolutos para promediar.
		data2.addColumn({type:"number", label:"GC1"}); 													// 11: DIF% para GC=1. 
		data2.addColumn({type:"number", label:"GC2"}); 													// 12: DIF% para GC=2.
		data2.addColumn({type:"number", label:"GC3"}); 													// 13: DIF% para GC=3.
		data2.addColumn({type:"number", label:"GC4 (trigo blando)"}); 					// 14: DIF% para GC=4 (trigo blando).
		data2.addColumn({type:"number", label:"DIF(%)"}); 								  		// 15: DIF% con redondeo para Grafico.
		data2.addColumn({type:"number", label:"CV(%)"}); 												// 16: CV% con redondeo para Grafico.	
		data2.addColumn({type:"number", label:"DIF(%)"}); 								  		// 17: DIF% sin redondeo.
		data2.addColumn({type:"number", label:"CV(%)"}); 												// 18: CV% sin redondeo.	

		window.campanias="";
		var j = 0;
		var manejos = document.getElementById("manejos").value;	
		var epoca = document.getElementById("epocas").options.selectedIndex+1;	// Epoca numerica (la del control es con fecha).
		for (var i = 0; i < data.getNumberOfRows(); i++) {
			if (data.getValue(i, usado) == 1) { 
				if (data.getValue(i, 1) == manejos) {
					if (data.getValue(i, 2) == epoca) {
						data2.addRows(1);
						data2.setCell(j, 0, j+1); // fila, col     											// 0: Orden: anotation.
						data2.setCell(j, 1, data.getValue(i, 1)); 											// 1: Manejo. 
						data2.setCell(j, 2, data.getValue(i, 2)); 											// 2: Epoca. 
						data2.setCell(j, 3, data.getValue(i, 3)); 											// 3: Cultivar.
						data2.setCell(j, 4, data.getValue(i, 4)); 											// 4: GC.
						var y = data.getValue(i, DF); 
						var x = data.getValue(i, CV);
						var a = Math.round(y);
						var b = Math.round(x);
						data2.setCell(j, 5, a);  																				// 5: DIF% con redondeo para mostrar los datos en la Tabla.
						data2.setCell(j, 6, b);  																				// 6: CV% con redondeo para mostrar los datos en la Tabla.
						data2.setCell(j, 8, data.getValue(i, usado)); 									// 8: Usado.
						// 9: Columna 9 tenia Epoca con fecha pero ya no está usada.
						data2.setCell(j, 10, data.getValue(i, DAT)); 										// 10: Datos absolutos (para promediar).
						data2.setCell(j, 15, a); 																				// 15: DIF% con redondeo para Grafico.
						data2.setCell(j, 16, b); 																				// 16: CV% con redondeo para Grafico.
						data2.setCell(j, 17, y); 																				// 17: DIF% sin redondeo.
						data2.setCell(j, 18, x); 																				// 18: CV% sin redondeo.
						
						// Label para campañas.
						var a = data.getValue(i, campania1);
						var c = a+"/"+(a+1-2000);
						if (anios>=2) {
							var a = data.getValue(i, campania1+1);
							c = c+", "+a+"/"+(a+1-2000);
						}
						if (anios>=3) {
							var a = data.getValue(i, campania1+2);
							c = c+", "+a+"/"+(a+1-2000);
						}
						if (anios>=4) {
							var a = data.getValue(i, campania1+3);
							c = c+", "+a+"/"+(a+1-2000);
						}
						window.campanias = c;
						j = j+1;
					}
				}
			}
		}		
		

		// Refinamiento para evitar que en el grafico se superpongan puntos con igual X e Y redondeados.
		var k = j;
		var media = 0;
		var inc = 0.025; // Incremento.
		for (var i = 0; i < k; i++) {
			for (var j = i + 1; j < k; j++){
				if (data2.getValue(i, 15) == data2.getValue(j, 15)){
					if (data2.getValue(i, 16) == data2.getValue(j, 16)){
					// Si los valores redondeados de X e Y son iguales, incremento el eje X para que no se superpongan los puntos en el grafico.
						if (data2.getValue(i, 18) >= data2.getValue(j, 18)){
							if (data2.getValue(i, 16) == 0) {
								data2.setCell(i, 16, data2.getValue(i, 16) + inc * 3);	
							}	else {
							data2.setCell(i, 16, data2.getValue(i, 16) * (1 + inc));
							data2.setCell(j, 16, data2.getValue(j, 16) * (1 - inc));
							}
						} else {
							if (data2.getValue(i, 16) == 0) {
								data2.setCell(j, 16, data2.getValue(i, 16) + inc * 3);	
							}	else {
								data2.setCell(i, 16, data2.getValue(i, 16) * (1 - inc));
								data2.setCell(j, 16, data2.getValue(j, 16) * (1 + inc));
							}
						}
					}
				}	
			}

			// Grupo de Calidad como Label.
			if (data2.getValue(i, 4)==1){
				data2.setCell(i, 11, data2.getValue(i, 15));	// 11: Datos del GC=1.
			} else if (data2.getValue(i, 4)==2){
				data2.setCell(i, 12, data2.getValue(i, 15));	// 12: Datos del GC=2.
			} else if (data2.getValue(i, 4)==3){
				data2.setCell(i, 13, data2.getValue(i, 15));	// 13: Datos del GC=3.
			} else if (data2.getValue(i, 4)==4){
				data2.setCell(i, 14, data2.getValue(i, 15));	// 14: Datos del GC=4.
			}
			
			var y = data2.getValue(i, 15);
			var x = data2.getValue(i, 16);
			var z = data2.getValue(i, 4);
			data2.setCell(i, 7, data2.getValue(i, 3)+"\n"+"DIF(%)="+y+"\n"+"CV(%)="+x+"\n"+"GC="+z+"\n"); // 7: Cultivar tooltip.

			// Media:
			media = media+data2.getValue(i, 10);
		}	// Fin Refinamiento para el grafico.

		var ymin = data2.getColumnRange(15).min;
		var ymax = data2.getColumnRange(15).max;
		var xmin = 0;
		var xmax = data2.getColumnRange(16).max;
		var xpro = 0;
		if (k>0) {
			window.media = media/k;
			xpro = (xmax+xmin)/2;
		}
		window.nn=k;
		//document.getElementById("label2").innerHTML = xpro;	// Para depuración.
		
		//Define la tabla.
		var tabla = new google.visualization.ChartWrapper({
			chartType: "Table",
			containerId: "tabla",
			view: {columns: [3, 4, 5, 6]},  
			options: {
				sortColumn: 2,
				sortAscending: false,
				// frozenColumns: 1,
				height: "100%",
				width: "100%"
			}
		});
	
		// Define el grafico.
		var v1 = document.getElementById("manejos");
		v1 = v1.options[v1.selectedIndex].text;
		var v2 = document.getElementById("epocas");
		v2 = v2.options[v2.selectedIndex].text;
		var v3 = crtgrupos.getState()["selectedValues"];
		if (v3 == undefined) {v3 = "todos";}
		var v4 = document.getElementById("lugar");
		v4 = v4.options[v4.selectedIndex].text;

		var chart_width = window.innerWidth; // Toma el ancho de la ventana.
		if (chart_width < 800){
				chart_width=chart_width*0.85;
		}else{
				chart_width=chart_width*0.40;
		}
		var chart_height=chart_width*0.75; // Proporcion 3:4.

		var chart  = new google.visualization.ChartWrapper({	
			chartType: "ScatterChart", 
			containerId: "figura",
			view: {columns: [16, 11, 7, 12, 7, 13, 7, 14, 7]}, // X, Y1, Tooltips, Y2, Tooltips, etc.
			options: {
				//title: window.titulo+"\n"+v4+"\n"+"Promedio de las últimas "+anios+" campañas"+"\n"+v1+", "+v2+" época",
				title: v4+".\n"+"Promedio de las últimas "+anios+" campañas."+"\n"+v1+", "+v2+" época.",
				width: chart_width,
				height: chart_height, 
				tooltip: {isHtml: true, textStyle: {bold: true}}, 
				colors: ["#36c", "#109618", "#dc3912", "#f90"], //azul, verde, rojo, naranja.
				legend: { position: "bottom" },// "none"
				crosshair: {trigger: "both", orientation: "both"},
				chartArea: {height: "60%", width: "75%"},
				annotations: {alwaysOutside: false,	textStyle: {bold: false}},
				vAxis: {
					title: "DIFERENCIA DE RENDIMIENTO (DIF, %)",
					format: "###",
					baseline: 0, //PEA: linea negra.
					textStyle: {bold: true, italic: false},
					titleTextStyle: {bold: true, italic: false},	
					minValue: ymin,
					maxValue: ymax
				},
				hAxis: {
					title: "COEFICIENTE DE VARIACIÓN (CV, %)",
					format: "###",
					baseline: xpro, //PEA: linea negra.
					textStyle: {bold: true, italic: false},
					titleTextStyle: {bold: true, italic: false},	
					minValue: xmin,
					maxValue: xmax
				}
			}
		});

		var dashboard = new google.visualization.Dashboard(document.getElementById("dashboard"));
		dashboard.bind(crtgrupos, [chart, tabla]);
		dashboard.draw(data2);	
		google.visualization.events.addListener(dashboard, "ready", Actualizar);

		function Actualizar(){
			// Muestra u oculta el resultado.
			var i=window.nn;
			if (i == 0) {
				Ocultar(true);
				document.getElementById("label1").innerHTML = "¡NO HAY DATOS DISPONIBLES PARA LA SELECCIÓN!<br><br>Intente cambiando el Nivel de manejo, la Cantidad de campañas promediadas o la Época de siembra";
				window.media=0;
			} else {
				Ocultar(false);
				document.getElementById("label1").innerHTML = "";
			}
			Actualizar_Detalles();
		}	
	
		function menu_copiar() {
			//var chart_div = document.getElementById("figura");
			//var chart_URL= window.chart_READY.getImageURI();
			////chart_div.innerHTML = "<img src="" + chart_URL + "">";
			////alert(chart_URL);  // Para depuración.
		}
	} // Fin function HandleQueryDrawChart.
	
	function Actualizar_Lugar_Epoca(){
		// Selecciona lugar.
		var lugar = document.getElementById("lugar").value;   
		if (lugar=="SAENZP") {
			window.opciones="&gid=2090992365&headers=1&tq=";
			window.subregion="NEA";
			window.responsable="A. Weiss.";
			//window.lugar_nombre = document.getElementById("lugar").options.namedItem("BALCA").text;
			//document.getElementById("manejos").getElementsByTagName("option")[1].selected = "selected";
		} else if (lugar=="RECONQ") {
			window.opciones="&gid=1528487083&headers=1&tq=";
			window.subregion="I";
			window.responsable="A. Brach.";
		} else if (lugar=="PARANA") {
			window.opciones="&gid=1851492594&headers=1&tq=";			
			window.subregion="III";
			window.responsable="L.C. Gieco y L.S. Schutt.";
		} else if (lugar=="MANFREDI") {
			window.opciones="&gid=1437170378&headers=1&tq=";
			window.subregion="IIN";
			window.responsable="M.L. Ferreyra.";
		} else if (lugar=="MJUAREZ") {
			window.opciones="&gid=1664025937&headers=1&tq=";
			window.subregion="IIN";
			window.responsable="C. Bainotti.";
		} else if (lugar=="PERGA") {
			window.opciones="&gid=1975558768&headers=1&tq=";
			window.subregion="IIN";
			window.responsable="I. Terrile.";
		} else if (lugar=="ROLDAN") {
			window.opciones="&gid=904446283&headers=1&tq=";
			window.subregion="IIN";
			window.responsable="F. Ayala.";
		} else if (lugar=="9JULIO") {
			window.opciones="&gid=725066066&headers=1&tq=";
			window.subregion="IIS";
			window.responsable="Tribus Agro";
		} else if (lugar=="CHACABUCO") {
			window.opciones="&gid=1976081791&headers=1&tq=";
			window.subregion="IIS";
			window.responsable="J. Severo.";
		} else if (lugar=="PLA") {
			window.opciones="&gid=1164634065&headers=1&tq=";
			window.subregion="IIS";
			window.responsable="Criadero Klein.";
		}	else if (lugar=="BALCA") {
				window.opciones="&gid=688276803&headers=1&tq=";
				window.subregion="IV";
				window.responsable="P.E. Abbate y col.";
		} else if (lugar=="BARROW") {
			window.opciones="&gid=581835447&headers=1&tq=";
			window.subregion="IV";
			window.responsable="F. Di Pane.";
		} else if (lugar=="BENITOJ") {
			window.opciones="&gid=197104928&headers=1&tq=";
			window.subregion="IV";
			window.responsable="Nidera S.A.";
		} else if (lugar=="LADULCE") {
			window.opciones="&gid=1871017838&headers=1&tq=";
			window.subregion="IV";
			window.responsable="H. Gonzalez y D. Martino.";
		} else if (lugar=="MIRAMAR") {
			window.opciones="&gid=1205896964&headers=1&tq=";
			window.subregion="IV";
			window.responsable="M. Villafañe.";
		} else if (lugar=="BORDENAVE") {
			window.opciones="&gid=1779518876&headers=1&tq=";
			window.subregion="VS";
			window.responsable="F. Moreyra.";
		} else {
			window.opciones="";
		}	

		var opciones="&gid=437743739&headers=1&tq="; // Hoja de epocas.
		var querystr = "SELECT *";
		var query = new google.visualization.Query(window.vinculo+opciones+querystr);
		query.send(function(response){ 
			if (response.isError()) {
				alert("Error in query: " + response.getMessage() + "   " + response.getDetailedMessage());
				return;
			}
			
			var data_epocas = response.getDataTable();
			var s="";
			var epoca1="", epoca2="", epoca3="", epoca4="";			
			for (var i = 0; i < data_epocas.getNumberOfRows(); i++) {
				s=data_epocas.getValue(i, 0); // fila, col.
				if (window.subregion==s) {
					epoca1=data_epocas.getValue(i, 1);
					epoca2=data_epocas.getValue(i, 2);
					epoca3=data_epocas.getValue(i, 3);
					epoca4=data_epocas.getValue(i, 4);
					break;		
				}
			}
			
			// Mantiene seleccionada la Epoca al cambiar de lugar.
			var x = document.getElementById("epocas");
			window.epoca_old=x.options.selectedIndex;
			if (window.epoca_old==-1) {window.epoca_old=0;}
			//document.getElementById("label2").innerHTML = window.epoca_old; // Para depuracion.
			x.options.remove(3);
			x.options.remove(2);
			x.options.remove(1);
			x.options.remove(0);
			var i=0;
			var z="";
			z = document.createElement("option");
			z.text = epoca1; x.options.add(z, i); i=i+1;
			z = document.createElement("option");
			z.text = epoca2; x.options.add(z, i); i=i+1;
			z = document.createElement("option");
			z.text = epoca3; x.options.add(z, i); i=i+1;
			z = document.createElement("option");
			z.text = epoca4; x.options.add(z, i); i=i+1;
			x.options.selectedIndex = window.epoca_old;
		});
	}

	function Actualizar_Detalles(){
		var t = "<table>";
		//t=t+"<tr><td colspan=2>"+"Detalles del Lugar:"+".</td></tr>";
		t=t+"<tr><td>"+"Colaborador del Lugar: "+window.responsable+"</td></tr>";
		t=t+"<tr><td>"+"Campañas promediadas: "+window.campanias+"</td></tr>";
		t=t+"<tr><td>"+"Rendimiento promedio de los datos: "+window.media.toFixed(1)+" qq/ha.</td></tr>";
		t=t+"</table>";
		document.getElementById("tabla1").innerHTML= t;						
	}

	function Ocultar(si){
		// Si si=1 oculta; sino muestra.
		if (si==true){
			document.getElementById("tabla").style.visibility = "hidden";  
			document.getElementById("figura").style.visibility = "hidden";  	
			document.getElementById("boton1").style.visibility = "hidden";  	
			document.getElementById("boton2").style.visibility = "hidden";  	
			document.getElementById("Leyenda_figura").style.visibility = "hidden";
			document.getElementById("Leyenda_tabla").style.visibility = "hidden";
		}else{
			document.getElementById("tabla").style.visibility = "visible";  
			document.getElementById("figura").style.visibility = "visible";  	
			document.getElementById("boton1").style.visibility = "visible";  	
			document.getElementById("boton2").style.visibility = "visible";  	
			document.getElementById("Leyenda_figura").style.visibility = "visible";
			document.getElementById("Leyenda_tabla").style.visibility = "visible";
		}
	}

	function Ultima_Actualizacion(){
		// Last modified script by Bernhard Friedrich; should work in all browsers 
		var mes = new Array("ene.", "feb.","mar.","abr.","may.","jun.", "jul.", "ago.", "sep.", "oct.","nov.", "dic.");
		var a = new Date(document.lastModified); 
		lm_year=a.getYear(); 
		if (lm_year<1000){                 
			if (lm_year<70){ 
				lm_year=2000+lm_year; 
			} else lm_year=1900+lm_year; 
		}                                 
		lm_month=a.getMonth(); 
		lm_day=a.getDate(); 
		if (lm_day<10){ 
			lm_day="0"+lm_day; 
		} 
		var t = lm_day+"-"+mes[lm_month]+"-"+lm_year;
		// return t;
		// La función no funciona. Ahora devuelve el valor ingresado manualmente.
		return window.actualizacion;

	}
	