using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace KML2Json
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            var dlg = new OpenFileDialog();
            string line;
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                // Read the file and display it line by line.
                var fileName = dlg.FileName;
                var file = new StreamReader(fileName);
                var outfileName = Path.GetFileNameWithoutExtension(fileName) + ".json";
                var outfile = new StreamWriter(outfileName);
                var state = -1;
                var name = "";
                var firstelement = true;
                while ((line = file.ReadLine()) != null)
                {
                    switch (state)
                    {
                        case -1:
                            if (line.StartsWith("<Placemark")) state = 0;
                            break;
                        case 0:
                            if (line.StartsWith("</Placemark"))
                            {
                                outfile.WriteLine(EndBlock(name));
                            } else
                            if (line.StartsWith("<name"))
                            {
                                name = Regex.Match(line, ">(.*)<").Groups[1].Value;
                                outfile.Write(StartBlock(name));
                            } else
                            if (line.StartsWith("<coordi"))
                            {
                                state = 1;
                                outfile.Write("[");
                                firstelement = true;
                            }
                            break;
                        case 1:
                        {
                            if (line.StartsWith("</coord")) { state = 0; outfile.Write("]"); continue;}
                            if (!firstelement) outfile.Write(",");
                            else firstelement = false;
                                    outfile.Write("["+line+"]");
                                
                            break;
                        }
                    }
                }
                outfile.Flush();
                outfile.Close();
                file.Close();
            }
        }

        private static string StartBlock(string name)
        {
            return "{ \"type\": \"Feature\",\"properties\": { \"name\": \"" + name +
                   "\" },\"geometry\": {\"type\": \"MultiPolygon\",\"coordinates\": [[";
        }

        private static string EndBlock(string name)
        {
            return "]]},\"id\": \"POL-" + name + "\"},";
        }
    }
}
