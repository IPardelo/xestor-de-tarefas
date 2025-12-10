' XestorDeTarefas - lanzador de escritorio
' Dobre clic: abre a app na súa propia ventá, sen navegador nin consola.
' Carga o código de app\src directamente: os cambios vense sen compilar nada
' (e mesmo coa ventá aberta, ao gardar un ficheiro).
' (Os ficheiros .vbs ábreos Windows Script Host, que non amosa a xanela negra.)
Option Explicit

Dim sh, fso, carpetaApp, electron, resultado
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

carpetaApp = fso.GetParentFolderName(WScript.ScriptFullName) & "\app"
electron = carpetaApp & "\node_modules\electron\dist\electron.exe"
sh.CurrentDirectory = carpetaApp

' A primeira vez instala as dependencias (npm install)
If Not fso.FileExists(electron) Then
	MsgBox "A primeira vez hai que instalar as dependencias (npm install), e tarda uns minutos." & vbCrLf & _
		"Preme Aceptar e agarda: a app abrirase soa.", vbInformation, "XestorDeTarefas"
	resultado = sh.Run("cmd /c npm install > npm-install.log 2>&1", 0, True)
	If resultado <> 0 Or Not fso.FileExists(electron) Then
		MsgBox "Non se puideron instalar as dependencias." & vbCrLf & vbCrLf & _
			"Abre unha terminal na carpeta app e executa:" & vbCrLf & vbCrLf & "    npm install" & vbCrLf & vbCrLf & _
			"(O detalle do erro está en app\npm-install.log)", vbCritical, "XestorDeTarefas"
		WScript.Quit 1
	End If
End If

sh.Run """" & electron & """ .", 1, False
